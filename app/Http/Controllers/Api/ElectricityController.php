<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use App\Models\ElectricityProvider;
use App\Models\Transaction;
use App\Jobs\ProcessElectricityPurchase;
use App\Services\DatavendroService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
            $transaction = $this->processAtomicTransaction($user->id, $totalAmount, function ($lockedUser) use ($request, $provider, $totalAmount, $serviceFee) {
                // Generate unique reference
                $reference = 'ELEC' . strtoupper(Str::random(8)) . time();
                $profit = $this->calculateProfitMargin($request->amount, 'electricity');

                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'electricity',
                    'amount' => $request->amount,
                    'fee' => $serviceFee,
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
                        'customer_address' => $request->customer_address,
                        'phone_number' => $request->phone_number,
                        'amount' => $request->amount,
                        'service_fee' => $serviceFee,
                        'total_amount' => $totalAmount,
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                        'processing_stage' => 'queued',
                        'queued_at' => now()->toISOString(),
                    ],
                ]);

                // Deduct from user's wallet
                $this->deductWallet($lockedUser, $totalAmount, 'API electricity purchase');

                return $transaction;
            });

            ProcessElectricityPurchase::dispatch($transaction->id)->onQueue('electricity');

            return response()->json([
                'success' => true,
                'status' => 'pending',
                'message' => 'Electricity purchase is being processed.',
                'transaction_id' => $transaction->id,
                'reference' => $transaction->reference,
            ], 202);

        } catch (\Exception $e) {
            Log::error('Failed to queue API electricity purchase', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Unable to start electricity purchase right now. Please try again.',
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
