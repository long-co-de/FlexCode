<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ElectricityProvider;
use App\Models\Transaction;
use App\Models\Beneficiary;
use App\Services\DatavendroService;
use App\Services\BorrowingEligibilityService;
use Illuminate\Support\Str;

class ElectricityController extends Controller
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
        $user = auth()->user();
        
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
        ]);

        $user = $request->user();
        $provider = ElectricityProvider::findOrFail($request->electricity_provider_id);

        $fee = 100;
        $totalAmount = $request->amount + $fee;

        if ($user->wallet_balance < $totalAmount) {
            return redirect()->back()->with('error', 'Insufficient wallet balance. Please fund your wallet.');
        }

        $reference = 'ELEC' . strtoupper(Str::random(8));

        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'electricity',
            'amount' => $request->amount,
            'fee' => $fee,
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
                'total_amount' => $totalAmount,
            ],
        ]);

        $user->wallet_balance -= $totalAmount;
        $user->save();

        $vt = $this->datavendroService->payElectricityBill(
            $request->meter_number,
            $provider->code,
            $request->amount,
            $request->meter_type
        );

        if ($vt['success']) {
            $transaction->status = 'successful';
            $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                'datavendro' => $vt['data'] ?? [],
            ]);
            $transaction->save();

            $token = $vt['data']['token'] ?? ($vt['data']['Token'] ?? ($vt['data']['POWERTOKEN'] ?? null));
            $successMsg = 'Electricity bill payment successful!'.($token ? ' Token: '.$token : '');
            return redirect()->route('dashboard')->with('success', $successMsg);
        } else {
            $user->wallet_balance += $totalAmount;
            $user->save();

            $transaction->status = 'failed';
            $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                'error' => $vt['message'] ?? 'Payment failed',
                'raw' => $vt['data'] ?? null,
            ]);
            $transaction->save();

            return redirect()->back()->with('error', $vt['message'] ?? 'Electricity bill payment failed. Please try again later.');
        }
    }
}
