<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use App\Models\ElectricityProvider;
use App\Models\Transaction;
use App\Services\DatavendroService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Traits\ProProfitCalculator;

class ElectricityController extends AtomicController
{
    use ProProfitCalculator;

    protected $datavendroService;

    public function __construct(DatavendroService $datavendroService)
    {
        $this->datavendroService = $datavendroService;
    }

    /**
     * Get all electricity providers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProviders()
    {
        if (ElectricityProvider::count() < 11) {
            $this->datavendroService->syncProviders();
        }
        
        $providers = ElectricityProvider::where('is_active', true)->get();

        return response()->json([
            'providers' => $providers,
        ]);
    }

    /**
     * Verify a meter number.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyMeter(Request $request)
    {
        $request->validate([
            'provider_id' => 'required|exists:electricity_providers,id',
            'meter_number' => 'required|string',
            'meter_type' => 'required|in:prepaid,postpaid',
        ]);

        $provider = ElectricityProvider::findOrFail($request->provider_id);

        $response = $this->datavendroService->validateMeter(
            $request->meter_number,
            $provider->code,
            $request->meter_type
        );

        if ($response['success']) {
            $customer = $response['data'];

            // Check for invalid meter in response
            if (isset($customer['invalid']) && $customer['invalid'] === true) {
                return response()->json([
                    'message' => 'Invalid meter number. Please check and try again.',
                ], 400);
            }

            // Additional check for name/address containing "INVALID"
            if (isset($customer['name']) && str_contains(strtoupper($customer['name']), 'INVALID METER')) {
                return response()->json([
                    'message' => 'Invalid meter number. Please check and try again.',
                ], 400);
            }

            return response()->json([
                'message' => 'Meter verified successfully',
                'data' => $response['data'],
            ]);
        } else {
            return response()->json([
                'message' => 'Meter verification failed: ' . ($response['message'] ?? 'Unknown error'),
            ], 400);
        }
    }

    /**
     * Process electricity bill payment.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'provider_id' => 'required|exists:electricity_providers,id',
            'meter_number' => 'required|string',
            'meter_type' => 'required|in:prepaid,postpaid',
            'amount' => 'required|numeric|min:500|max:50000',
            'customer_name' => 'required|string',
            'customer_address' => 'nullable|string',
            'phone_number' => 'required|string',
            'pin' => 'required|string|size:4',
            'request_id' => 'required|string|min:20',
        ]);

        $user = $request->user();

        // Deduplication check
        if ($this->isDuplicateRequest($request->request_id, $user->id, 'api_electricity_purchase')) {
            return response()->json(['message' => 'Duplicate request detected.'], 400);
        }

        // Rate limiting
        if ($this->isRateLimited($user->id, 'api_electricity_purchase')) {
            return response()->json(['message' => 'Too many requests. Please wait.'], 429);
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Invalid transaction PIN.'], 403);
        }

        $provider = ElectricityProvider::findOrFail($request->provider_id);

        // Calculate service fee (if any)
        $serviceFee = $provider->service_fee ?? 0;
        $totalAmount = $request->amount + $serviceFee;

        try {
            $result = $this->processAtomicTransaction($user->id, $totalAmount, function ($lockedUser) use ($request, $provider, $totalAmount, $serviceFee) {
                // Generate unique reference
                $reference = 'ELEC' . strtoupper(Str::random(8)) . time();

                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'electricity',
                    'amount' => $request->amount,
                    'fee' => $serviceFee,
                    'status' => 'pending',
                    'recipient' => $request->meter_number,
                    'description' => $provider->name . ' Electricity Bill Payment of ₦' . $request->amount . ' for ' . $request->customer_name,
                    'meta_data' => [
                        'provider' => $provider->name,
                        'provider_code' => $provider->code,
                        'meter_number' => $request->meter_number,
                        'meter_type' => $request->meter_type,
                        'customer_name' => $request->customer_name,
                        'customer_address' => $request->customer_address,
                        'phone_number' => $request->phone_number,
                        'amount' => $request->amount,
                        'service_fee' => $serviceFee,
                        'total_amount' => $totalAmount,
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);

                // Deduct from user's wallet
                $this->deductWallet($lockedUser, $totalAmount, 'API electricity purchase');

                $response = $this->datavendroService->payElectricityBill(
                    $request->meter_number,
                    $provider->code,
                    $request->amount,
                    $request->meter_type,
                    $reference,
                    $request->phone_number,
                    $request->customer_name,
                    $request->customer_address
                );

                if ($response['success']) {
                    $token = $response['token'] ?? null;
                    $cleanToken = $token;
                    if (!empty($token) && str_starts_with($token, 'Token : ')) {
                        $cleanToken = substr($token, 8);
                    }

                    // Update transaction status and token
                    $transaction->status = 'successful';
                    $transaction->meta_data = array_merge($transaction->meta_data, [
                        'token' => $cleanToken,
                        'original_token' => $token,
                        'units' => $response['units'] ?? null,
                        'api_response' => $response['data'] ?? null,
                        'api_transaction_id' => $response['api_transaction_id']
                            ?? (($response['data']['id'] ?? ($response['data']['ident'] ?? null))),
                        'api_status' => $response['api_status'] ?? null,
                        'api_response_received_at' => now(),
                    ]);
                    $transaction->save();

                    // Calculate and record system profit
                    $profit = $this->calculateProfitMargin($request->amount, 'electricity');
                    $transaction->profit = $profit;
                    $transaction->save();
                    
                    $this->recordSystemProfit($transaction, $profit, 'electricity');

                    return [
                        'success' => true,
                        'message' => 'Electricity bill payment successful!',
                        'transaction' => $transaction,
                        'token' => $cleanToken,
                        'units' => $response['units'] ?? null,
                    ];
                } else {
                    // If failed, refund the user
                    $lockedUser->wallet_balance += $totalAmount;
                    $lockedUser->save();

                    // Update transaction status
                    $transaction->status = 'failed';
                    $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                        'error' => $response['message'] ?? 'Unknown error'
                    ]);
                    $transaction->save();

                    throw new \Exception($response['message'] ?? 'Electricity bill payment failed at provider.');
                }
            });

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    protected function calculateProfitMargin($amount, $type = 'electricity')
    {
        return $this->isProUser()
            ? $this->getProProfitMargin($amount, 'electricity')
            : parent::calculateProfitMargin($amount, 'electricity');
    }
}
