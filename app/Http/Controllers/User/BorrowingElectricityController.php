<?php
// File: BorrowingElectricityController.php
namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\ElectricityProvider;
use App\Models\Borrowing;
use App\Models\BorrowingEligibility;
use App\Models\BorrowSetting;
use App\Services\BorrowingService;
use App\Services\BorrowingEligibilityService;
use App\Services\DatavendroService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class BorrowingElectricityController extends AtomicController
{
    protected $borrowingService;
    protected $eligibilityService;
    protected $datavendroService;

    public function __construct(
        BorrowingService $borrowingService,
        BorrowingEligibilityService $eligibilityService,
        DatavendroService $datavendroService
    ) {
        $this->borrowingService = $borrowingService;
        $this->eligibilityService = $eligibilityService;
        $this->datavendroService = $datavendroService;
    }

    /**
     * Display borrowing options for electricity.
     */
    public function index()
    {
        $user = Auth::user();

        // Check eligibility with service type
        $eligibility = $this->eligibilityService->checkEligibility($user, 'electricity');

        // Check if user has active card
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();

        $providers = ElectricityProvider::where('is_active', true)->get();

        // Get active borrowings
        $activeBorrowings = $user->activeBorrowings()
            ->where('type', 'electricity')
            ->orderBy('due_date', 'asc')
            ->get();

        // Get borrow settings
        $borrowSetting = BorrowSetting::where('service_type', 'electricity')->first();
        $isFirstTimeBorrow = ! $user->borrowings()->where('type', 'electricity')->exists();

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

        return Inertia::render('User/Borrow/Electricity', [
            'providers' => $providers,
            'eligibility' => $eligibilityResponse,
            'activeBorrowings' => $activeBorrowings,
            'hasActiveCard' => $hasActiveCard,
            'borrowSettings' => [
                'electricity' => $borrowSetting ? [
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
     * Verify meter number for borrowing.
     */
    public function verifyMeter(Request $request)
    {
        $request->validate([
            'electricity_provider_id' => 'required|exists:electricity_providers,id',
            'meter_number' => 'required|string',
            'meter_type' => 'required|string|in:prepaid,postpaid',
        ]);

        $provider = ElectricityProvider::findOrFail($request->electricity_provider_id);

        $verify = $this->datavendroService->validateMeter(
            $request->meter_number,
            $provider->code,
            $request->meter_type
        );

        if (!$verify['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $verify['message'] ?? 'Unable to verify meter',
            ], 422);
        }

        $customer = $verify['data'];
        return response()->json([
            'status' => 'success',
            'message' => 'Meter verified successfully',
            'data' => [
                'customer_name' => $customer['name'] ?? ($customer['Customer_Name'] ?? ($customer['invalid'] ?? '')),
                'address' => $customer['address'] ?? ($customer['Address'] ?? ''),
                'meter_number' => $request->meter_number,
                'meter_type' => $request->meter_type,
            ],
        ]);
    }

    /**
     * Borrow electricity bill payment.
     */
    public function borrow(Request $request)
    {
        $borrowSetting = BorrowSetting::where('service_type', 'electricity')
            ->where('is_active', true)
            ->first();

        if (! $borrowSetting) {
            return redirect()->back()->with('error', 'Electricity borrowing is currently unavailable.');
        }

        $user = Auth::user();
        $isFirstTimeBorrow = ! $user->borrowings()->where('type', 'electricity')->exists();
        $minAmount = $isFirstTimeBorrow ? (float) $borrowSetting->first_time_min_amount : (float) $borrowSetting->min_amount;
        $maxAmount = (float) $borrowSetting->max_amount;

        $request->validate([
            'electricity_provider_id' => 'required|exists:electricity_providers,id',
            'meter_number' => 'required|string',
            'meter_type' => 'required|string|in:prepaid,postpaid',
            'amount' => "required|numeric|min:{$minAmount}|max:{$maxAmount}",
            'customer_name' => 'required|string',
            'address' => 'required|string',
            'save_as_beneficiary' => 'nullable|boolean',
            'beneficiary_name' => 'nullable|string|max:255',
            'pin' => 'required|string|size:4',
            'request_id' => 'nullable|string',
        ]);

        // Rate limiting
        if ($this->isRateLimited($user->id, 'borrow_electricity')) {
            return redirect()->back()->with('error', 'Too many requests. Please try again in a minute.');
        }

        // Deduplication check
        if ($request->request_id && $this->isDuplicateRequest($request->request_id, $user->id, 'borrow_electricity')) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        // SECURITY: Check if user has active linked card before allowing borrowing
        $activeCard = $user->cards()->where('is_active', true)->first();
        if (!$activeCard) {
            return redirect()->route('cards.link', ['return_to' => route('borrow.electricity')])
                ->with('warning', 'Please link a payment card to enable borrowing functionality.');
        }

        // Verify PIN
        if (!\Illuminate\Support\Facades\Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $provider = ElectricityProvider::findOrFail($request->electricity_provider_id);

        try {
            // Process borrowing atomically
            $borrowing = $this->processAtomicTransaction($user->id, 0, function ($lockedUser) use ($request, $provider, $borrowSetting) {
                return $this->borrowingService->borrowElectricity(
                    $lockedUser,
                    $request->meter_number,
                    $request->amount,
                    $provider->code,
                    $request->meter_type,
                    (int) $borrowSetting->due_days
                );
            });

            // Save as beneficiary if requested
            if ($request->save_as_beneficiary && $request->beneficiary_name) {
                \App\Models\Beneficiary::create([
                    'user_id' => $user->id,
                    'name' => $request->beneficiary_name,
                    'phone_number' => $request->meter_number, // Using meter number as phone number
                    'service_type' => 'electricity',
                    'network_id' => null,
                    'is_favorite' => false,
                    'meta_data' => [
                        'meter_type' => $request->meter_type,
                        'customer_name' => $request->customer_name,
                        'address' => $request->address,
                        'provider_id' => $provider->id,
                    ],
                ]);
            }

            return redirect()->route('borrow.electricity.success', ['borrowing' => $borrowing->id])
                ->with('success', 'Electricity bill borrowed successfully! Repayment due on ' . $borrowing->due_date->format('F d, Y'));
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
