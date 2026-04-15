<?php
// File: BorrowingDataController.php
namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\Network;
use App\Models\DataPlan;
use App\Models\Borrowing;
use App\Models\BorrowingEligibility;
use App\Models\BorrowSetting;
use App\Services\BorrowingService;
use App\Services\BorrowingEligibilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class BorrowingDataController extends AtomicController
{
    protected $borrowingService;
    protected $eligibilityService;

    public function __construct(
        BorrowingService $borrowingService,
        BorrowingEligibilityService $eligibilityService
    ) {
        $this->borrowingService = $borrowingService;
        $this->eligibilityService = $eligibilityService;
    }

    /**
     * Display borrowing options for data.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Check eligibility with service type
        $eligibility = $this->eligibilityService->checkEligibility($user, 'data');
        
        // Check if user has active card
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();
        
        $networks = Network::where('is_active', true)
            ->with(['dataPlans' => function($query) {
                $query->where('is_active', true);
            }])
            ->get();

        // Get active borrowings
        $activeBorrowings = $user->activeBorrowings()
            ->where('type', 'data')
            ->orderBy('due_date', 'asc')
            ->get();

        // Get borrow settings
        $borrowSetting = BorrowSetting::where('service_type', 'data')->first();
        $isFirstTimeBorrow = ! $user->borrowings()->where('type', 'data')->exists();

        // Prepare eligibility response with rejection reason and action
        $eligibilityResponse = [
            'is_eligible' => $eligibility->isEligible(),
            'credit_limit' => $eligibility->credit_limit,
            'available_credit' => $eligibility->available_credit,
            'credit_score' => $eligibility->credit_score,
            'rejection_reason' => $eligibility->rejection_reason,
        ];

        // Add actionable guidance if not eligible
        if (!$eligibility->isEligible()) {
            if (!$hasActiveCard) {
                $eligibilityResponse['action'] = 'Link a payment card to enable borrowing';
                $eligibilityResponse['action_type'] = 'link_card';
                $eligibilityResponse['action_button'] = 'Link Card Now';
                $eligibilityResponse['rejection_reason_type'] = 'no_card';
            } else {
                $eligibilityResponse['action'] = 'Complete more transactions to improve your credit score and become eligible for borrowing.';
                $eligibilityResponse['action_type'] = 'build_credit';
                $eligibilityResponse['rejection_reason_type'] = 'credit_score';
            }
        }

        return Inertia::render('User/Borrow/Data', [
            'networks' => $networks,
            'eligibility' => $eligibilityResponse,
            'activeBorrowings' => $activeBorrowings,
            'hasActiveCard' => $hasActiveCard,
            'borrowSettings' => [
                'data' => $borrowSetting ? [
                    'min_amount' => (float) $borrowSetting->min_amount,
                    'max_amount' => (float) $borrowSetting->max_amount,
                    'first_time_min_amount' => (float) $borrowSetting->first_time_min_amount,
                    'first_time_credit_limit' => (float) $borrowSetting->first_time_credit_limit,
                    'is_first_time_borrow' => $isFirstTimeBorrow,
                    'effective_min_amount' => $isFirstTimeBorrow
                        ? (float) $borrowSetting->first_time_min_amount
                        : (float) $borrowSetting->min_amount,
                    'base_interest_rate' => $borrowSetting->base_interest_rate,
                    'good_credit_interest_rate' => $borrowSetting->good_credit_interest_rate,
                    'due_days' => $borrowSetting->due_days,
                ] : null,
            ],
        ]);
    }

    /**
     * Borrow data.
     */
    public function borrow(Request $request)
    {
        $borrowSetting = BorrowSetting::where('service_type', 'data')
            ->where('is_active', true)
            ->first();
        if (! $borrowSetting) {
            return redirect()->back()->with('error', 'Data borrowing is currently unavailable.');
        }

        $request->validate([
            'network_id' => 'required|exists:networks,id',
            'data_plan_id' => 'required|exists:data_plans,id',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'save_as_beneficiary' => 'nullable|boolean',
            'beneficiary_name' => 'nullable|string|max:255',
            'pin' => 'required|string|size:4',
            'request_id' => 'nullable|string',
        ]);

        $user = Auth::user();
        $isFirstTimeBorrow = ! $user->borrowings()->where('type', 'data')->exists();
        $minAmount = $isFirstTimeBorrow ? (float) $borrowSetting->first_time_min_amount : (float) $borrowSetting->min_amount;
        $maxAmount = (float) $borrowSetting->max_amount;

        // Rate limiting
        if ($this->isRateLimited($user->id, 'borrow_data')) {
            return redirect()->back()->with('error', 'Too many requests. Please try again in a minute.');
        }

        // Deduplication check
        if ($request->request_id && $this->isDuplicateRequest($request->request_id, $user->id, 'borrow_data')) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        // SECURITY: Check if user has active linked card before allowing borrowing
        $activeCard = $user->cards()->where('is_active', true)->first();
        if (!$activeCard) {
            return redirect()->route('cards.link', ['return_to' => route('borrow.data')])
                ->with('warning', 'Please link a payment card to enable borrowing functionality.');
        }

        // Verify PIN
        if (!\Illuminate\Support\Facades\Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        // Get data plan details
        $dataPlan = DataPlan::findOrFail($request->data_plan_id);
        $network = Network::findOrFail($request->network_id);

        if (!$dataPlan->dataplan_id) {
            return redirect()->back()->with('error', 'This data plan is currently unavailable for borrowing. Please try another one.');
        }

        $planAmount = (float) $dataPlan->selling_price;
        if ($planAmount < $minAmount) {
            return redirect()->back()->with('error', "Selected plan amount must be at least NGN {$minAmount}.");
        }
        if ($maxAmount > 0 && $planAmount > $maxAmount) {
            return redirect()->back()->with('error', "Selected plan amount must not exceed NGN {$maxAmount}.");
        }

        try {
            // Process borrowing atomically
            $borrowing = $this->processAtomicTransaction($user->id, 0, function ($lockedUser) use ($request, $dataPlan, $network, $borrowSetting) {
                return $this->borrowingService->borrowData(
                    $lockedUser,
                    $request->phone_number,
                    $dataPlan->dataplan_id ?? $dataPlan->id,
                    $dataPlan->selling_price,
                    $network->code,
                    (int) $borrowSetting->due_days
                );
            });

            // Save as beneficiary if requested
            if ($request->save_as_beneficiary && $request->beneficiary_name) {
                \App\Models\Beneficiary::create([
                    'user_id' => $user->id,
                    'name' => $request->beneficiary_name,
                    'phone_number' => $request->phone_number,
                    'service_type' => 'data',
                    'network_id' => $network->id,
                    'is_favorite' => false,
                    'meta_data' => [
                        'last_plan_id' => $dataPlan->id,
                        'last_plan_name' => $dataPlan->name,
                    ],
                ]);
            }

            return redirect()->route('borrow.data.success', ['borrowing' => $borrowing->id])
                ->with('success', 'Data borrowed successfully! Repayment due on ' . $borrowing->due_date->format('F d, Y'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Show borrowing success page.
     */
    public function success(Borrowing $borrowing)
    {
        $user = Auth::user();
        
        if ($borrowing->user_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('User/Borrow/Success', [
            'borrowing' => $borrowing->load('user'),
        ]);
    }
}
