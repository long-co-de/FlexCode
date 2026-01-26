<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ElectricityProvider;
use App\Models\Transaction;
use App\Models\Beneficiary;
use App\Services\DatavendroService;
use App\Services\BorrowingEligibilityService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class ElectricityController extends AtomicController
{
    protected $datavendroService;
    protected $eligibilityService;

    public function __construct(DatavendroService $datavendroService, BorrowingEligibilityService $eligibilityService)
    {
        $this->datavendroService = $datavendroService;
        $this->eligibilityService = $eligibilityService;
    }

    /**
     * Display the electricity bill payment page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth('web')->user();

        $eligibility = $this->eligibilityService->checkEligibility($user, 'electricity');
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();

        $electricityProviders = ElectricityProvider::where('is_active', true)->get();

        $beneficiaries = Beneficiary::where('user_id', $user->id)
            ->where('service_type', 'electricity')
            ->orderBy('is_favorite', 'desc')
            ->orderBy('name')
            ->get();

        $eligibilityResponse = [
            'is_eligible' => $eligibility->isEligible(),
            'credit_limit' => $eligibility->credit_limit,
            'available_credit' => $eligibility->available_credit,
            'credit_score' => $eligibility->credit_score,
            'rejection_reason' => $eligibility->rejection_reason,
        ];

        if (!$eligibility->isEligible()) {
            if (!$hasActiveCard) {
                $eligibilityResponse['rejection_reason_type'] = 'no_card';
            } elseif ($eligibility->eligibility_criteria && isset($eligibility->eligibility_criteria['account_age_days'])) {
                $eligibilityResponse['rejection_reason_type'] = 'account_age';
            } else {
                $eligibilityResponse['rejection_reason_type'] = 'credit_score';
            }
        }

        // return back()->with('info', 'this service is temporarily unavailable at the moment. We are working to restore it as soon as possible.');
        return Inertia::render('User/Electricity', [
            'electricityProviders' => $electricityProviders,
            'beneficiaries' => $beneficiaries,
            'eligibility' => $eligibilityResponse,
            'hasActiveCard' => $hasActiveCard,
        ]);
    }

    /**
     * Verify meter number.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
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
     * Process electricity bill payment.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'electricity_provider_id' => 'required|exists:electricity_providers,id',
            'meter_number' => 'required|string',
            'meter_type' => 'required|string|in:prepaid,postpaid',
            'amount' => 'required|numeric|min:500|max:50000',
            'customer_name' => 'required|string',
            'address' => 'required|string',
            'pin' => 'required|string|size:4',
            'request_id' => 'nullable|string',
        ]);
        // return back()->with('info', 'this service is temporarily unavailable at the moment. We are working to restore it as soon as possible.');

        $user = $request->user();

        // **SECURITY FIX 1: Check for duplicate request**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'electricity_purchase')) {
            return redirect()->back()->with('error', 'This request is already being processed. Please wait.');
        }

        // **SECURITY FIX 2: Rate limiting**
        if ($this->isRateLimited($user->id, 'electricity_purchase')) {
            return redirect()->back()->with('error', 'Too many attempts. Please wait before trying again.');
        }

        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $provider = ElectricityProvider::findOrFail($request->electricity_provider_id);

        $vat = 100;
        $fee = 100;
        $totalAmount = $request->amount + $fee + $vat;

        try {
            $result = $this->processAtomicTransaction($user->id, $totalAmount, function ($lockedUser) use ($request, $provider, $totalAmount, $fee, $vat, $requestId) {

                $reference = 'ELEC' . strtoupper(Str::random(10)) . time();
                $profit = $this->calculateProfitMargin($request->amount);

                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'electricity',
                    'amount' => $request->amount,
                    'fee' => $fee + $vat,
                    'profit' => $profit,
                    'status' => 'pending',
                    'recipient' => $request->meter_number,
                    'description' => $provider->name . ' Electricity Bill Payment of ₦' . $request->amount . ' for ' . $request->customer_name,
                    'meta_data' => [
                        'provider' => $provider->name,
                        'provider_code' => $provider->code,
                        'meter_number' => $request->meter_number,
                        'meter_type' => $request->meter_type,
                        'customer_name' => $request->customer_name,
                        'address' => $request->address,
                        'amount' => $request->amount,
                        'fee' => $fee,
                        'vat' => $vat,
                        'total_amount' => $totalAmount,
                        'request_id' => $requestId,
                    ],
                ]);

                // Deduct from wallet
                $this->deductWallet($lockedUser, $totalAmount, 'electricity bill payment');

                return $transaction;
            });

            $transaction = $result;

            $vt = $this->datavendroService->payElectricityBill(
                $request->meter_number,
                $provider->code,
                $request->amount,
                $request->meter_type,
                $transaction->reference,
                $user->phone_number ?? null
            );

            if ($vt['success']) {
                $transaction->status = 'successful';
                $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                    'datavendro' => $vt['data'] ?? [],
                    'token' => $vt['token'] ?? null,
                    'units' => $vt['units'] ?? null,
                    'completed_at' => now(),
                ]);
                $transaction->save();

                // Record system profit
                $this->recordSystemProfit($transaction, $transaction->profit, 'electricity');

                $user->notify(new \App\Notifications\PurchaseConfirmation($transaction, 'electricity'));

                $token = $vt['token'] ?? null;
                $successMsg = 'Electricity bill payment successful!' . ($token ? ' Token: ' . $token : '');
                return redirect()->route('dashboard')->with('success', $successMsg);
            } else {
                // API failed, refund the user using atomic helper
                $this->failAndRefund($transaction, $user->id, $totalAmount, $vt);

                return redirect()->back()->with('error', $vt['message'] ?? 'Electricity bill payment failed. Your money has been refunded.');
            }
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    protected function calculateProfitMargin($amount, $type = null)
    {
        $user = auth('web')->user();
        $settings = \App\Models\Setting::first();

        if ($user && $user->is_pro && $user->pro_expires_at > now()) {
            return $amount * (($settings->pro_electricity_profit_percentage ?? 2) / 100);
        }

        return parent::calculateProfitMargin($amount, 'electricity');
    }
}
