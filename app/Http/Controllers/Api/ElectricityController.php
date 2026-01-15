<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ElectricityProvider;
use App\Models\Transaction;
use App\Services\DatavendroService;
use Illuminate\Support\Str;

class ElectricityController extends Controller
{
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
        ]);

        $user = $request->user();
        $provider = ElectricityProvider::findOrFail($request->provider_id);

        // Calculate service fee (if any)
        $serviceFee = $provider->service_fee ?? 0;
        $totalAmount = $request->amount + $serviceFee;

        // Check if user has enough balance
        if ($user->wallet_balance < $totalAmount) {
            return response()->json([
                'message' => 'Insufficient wallet balance. Please fund your wallet.',
            ], 400);
        }

        // Generate unique reference
        $reference = 'ELEC' . strtoupper(Str::random(8));

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
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
            ],
        ]);

        // Deduct from user's wallet
        $user->wallet_balance -= $totalAmount;
        $user->save();

        $response = $this->datavendroService->payElectricityBill(
            $request->meter_number,
            $provider->code,
            $request->amount,
            $request->meter_type
        );

        if ($response['success']) {
            // Update transaction status and token
            $transaction->status = 'successful';
            $transaction->meta_data = array_merge($transaction->meta_data, [
                'token' => $response['data']['token'] ?? null,
                'units' => $response['data']['units'] ?? null,
            ]);
            $transaction->save();

            return response()->json([
                'message' => 'Electricity bill payment successful!',
                'transaction' => $transaction,
                'token' => $response['data']['token'] ?? null,
            ]);
        } else {
            // If failed, refund the user
            $user->wallet_balance += $totalAmount;
            $user->save();

            // Update transaction status
            $transaction->status = 'failed';
            $transaction->save();

            return response()->json([
                'message' => 'Electricity bill payment failed: ' . ($response['message'] ?? 'Unknown error'),
                'transaction' => $transaction,
            ], 400);
        }
    }
}
