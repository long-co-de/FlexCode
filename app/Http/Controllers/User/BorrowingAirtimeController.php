<?php
// File: BorrowingAirtimeController.php
namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\Network;
use App\Models\Borrowing;
use App\Models\BorrowingEligibility;
use App\Models\BorrowSetting;
use App\Services\BorrowingService;
use App\Services\BorrowingEligibilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class BorrowingAirtimeController extends AtomicController
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
     * Display borrowing options for airtime.
     */
    public function index()
    {
        $user = Auth::user();

        // Check eligibility with service type
        $eligibility = $this->eligibilityService->checkEligibility($user, 'airtime');

        // Check if user has active card
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();

        $networks = Network::where('is_active', true)
            ->with(['airtimeDiscounts' => function ($query) {
                $query->where('is_active', true);
            }])
            ->get();

        // Get active borrowings
        $activeBorrowings = $user->activeBorrowings()
            ->where('type', 'airtime')
            ->orderBy('due_date', 'asc')
            ->get();

        // Get borrow settings
        $borrowSetting = BorrowSetting::where('service_type', 'airtime')->first();

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

        return Inertia::render('User/Borrow/Airtime', [
            'networks' => $networks,
            'eligibility' => $eligibilityResponse,
            'activeBorrowings' => $activeBorrowings,
            'hasActiveCard' => $hasActiveCard,
            'borrowSettings' => [
                'airtime' => $borrowSetting ? [
                    'min_amount' => (float) $borrowSetting->min_amount,
                    'max_amount' => (float) $borrowSetting->max_amount,
                    'first_time_min_amount' => (float) $borrowSetting->first_time_min_amount,
                    'first_time_credit_limit' => (float) $borrowSetting->first_time_credit_limit,
                    'base_interest_rate' => $borrowSetting->base_interest_rate,
                    'good_credit_interest_rate' => $borrowSetting->good_credit_interest_rate,
                    'due_days' => $borrowSetting->due_days,
                ] : null,
            ],
        ]);
    }

    /**
     * Borrow airtime.
     */
    public function borrow(Request $request)
    {
        $borrowSetting = BorrowSetting::where('service_type', 'airtime')
            ->where('is_active', true)
            ->first();

        if (! $borrowSetting) {
            return redirect()->back()->with('error', 'Airtime borrowing is currently unavailable.');
        }

        $request->validate([
            'network_id' => 'required|exists:networks,id',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'amount' => "required|numeric|min:{$borrowSetting->min_amount}|max:{$borrowSetting->max_amount}",
            'airtime_type' => 'required|string|in:VTU,AWOOF,SHARE,SELL',
            'duration' => 'nullable|integer|in:3,7',
            'save_as_beneficiary' => 'nullable|boolean',
            'beneficiary_name' => 'nullable|string|max:255',
            'pin' => 'required|string|size:4',
            'request_id' => 'nullable|string',
        ]);

        $user = Auth::user();

        // Rate limiting
        if ($this->isRateLimited($user->id, 'borrow_airtime')) {
            return redirect()->back()->with('error', 'Too many requests. Please try again in a minute.');
        }

        // Deduplication check
        if ($request->request_id && $this->isDuplicateRequest($request->request_id, $user->id, 'borrow_airtime')) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        // SECURITY: Check if user has active linked card before allowing borrowing
        $activeCard = $user->cards()->where('is_active', true)->first();
        if (!$activeCard) {
            return redirect()->route('cards.link', ['return_to' => route('borrow.airtime')])
                ->with('warning', 'Please link a payment card to enable borrowing functionality.');
        }

        // Verify PIN
        if (!\Illuminate\Support\Facades\Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $network = Network::findOrFail($request->network_id);

        try {
            // Process borrowing atomically
            $borrowing = $this->processAtomicTransaction($user->id, 0, function ($lockedUser) use ($request, $network) {
                return $this->borrowingService->borrowAirtime(
                    $lockedUser,
                    $request->phone_number,
                    $request->amount,
                    $network->name,
                    $request->duration ?? 7
                );
            });

            // Save as beneficiary if requested
            if ($request->save_as_beneficiary && $request->beneficiary_name) {
                \App\Models\Beneficiary::create([
                    'user_id' => $user->id,
                    'name' => $request->beneficiary_name,
                    'phone_number' => $request->phone_number,
                    'service_type' => 'airtime',
                    'network_id' => $network->id,
                    'is_favorite' => false,
                    'meta_data' => [
                        'airtime_type' => $request->airtime_type,
                        'last_amount' => $request->amount,
                    ],
                ]);
            }

            return redirect()->route('borrow.airtime.success', ['borrowing' => $borrowing->id])
                ->with('success', 'Airtime borrowed successfully! Repayment due on ' . $borrowing->due_date->format('F d, Y'));
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
