<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CableProvider;
use App\Models\CablePlan;
use App\Models\Transaction;
use App\Services\DatavendroService;
use Illuminate\Support\Str;

class CableController extends Controller
{
    protected $datavendroService;

    public function __construct(DatavendroService $datavendroService)
    {
        $this->datavendroService = $datavendroService;
    }

    /**
     * Get all cable providers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProviders()
    {
        $providers = CableProvider::where('is_active', true)->get();

        return response()->json([
            'providers' => $providers,
        ]);
    }

    /**
     * Get plans for a specific cable provider.
     *
     * @param  string  $provider
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPlans($provider)
    {
        $provider = CableProvider::where('code', $provider)
            ->orWhere('id', $provider)
            ->firstOrFail();

        $plans = CablePlan::where('provider_id', $provider->id)
            ->where('is_active', true)
            ->orderBy('selling_price', 'asc')
            ->get();

        return response()->json([
            'provider' => $provider,
            'plans' => $plans,
        ]);
    }

    /**
     * Verify a smart card number.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifySmartCard(Request $request)
    {
        $request->validate([
            'provider_id' => 'required|exists:cable_providers,id',
            'smart_card_number' => 'required|string',
        ]);

        $provider = CableProvider::findOrFail($request->provider_id);

        $response = $this->datavendroService->validateIuc(
            $request->smart_card_number,
            $provider->code
        );

        if ($response['success']) {
            return response()->json([
                'message' => 'Smart card verified successfully',
                'data' => $response['data'],
            ]);
        } else {
            return response()->json([
                'message' => 'Smart card verification failed: ' . ($response['message'] ?? 'Unknown error'),
            ], 400);
        }
    }

    /**
     * Process cable subscription purchase.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:cable_plans,id',
            'smart_card_number' => 'required|string',
            'customer_name' => 'required|string',
        ]);

        $user = $request->user();
        $plan = CablePlan::with('provider')->findOrFail($request->plan_id);

        // Check if user has enough balance
        if ($user->wallet_balance < $plan->selling_price) {
            return response()->json([
                'message' => 'Insufficient wallet balance. Please fund your wallet.',
            ], 400);
        }

        // Generate unique reference
        $reference = 'CABLE' . strtoupper(Str::random(8));

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'cable',
            'amount' => $plan->selling_price,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $request->smart_card_number,
            'description' => $plan->provider->name . ' ' . $plan->name . ' Subscription for ' . $request->customer_name,
            'meta_data' => [
                'provider' => $plan->provider->name,
                'provider_code' => $plan->provider->code,
                'plan_name' => $plan->name,
                'plan_code' => $plan->code,
                'smart_card_number' => $request->smart_card_number,
                'customer_name' => $request->customer_name,
                'amount' => $plan->selling_price,
            ],
        ]);

        // Deduct from user's wallet
        $user->wallet_balance -= $plan->selling_price;
        $user->save();

        // Process with Datavendro API
        $response = $this->datavendroService->subscribeCable(
            $request->smart_card_number,
            $plan->provider->code,
            $plan->code
        );

        if ($response['success']) {
            // Update transaction status
            $transaction->status = 'successful';
            $transaction->save();

            return response()->json([
                'message' => 'Cable subscription successful!',
                'transaction' => $transaction,
            ]);
        } else {
            // If failed, refund the user
            $user->wallet_balance += $plan->selling_price;
            $user->save();

            // Update transaction status
            $transaction->status = 'failed';
            $transaction->save();

            return response()->json([
                'message' => 'Cable subscription failed: ' . ($response['message'] ?? 'Unknown error'),
                'transaction' => $transaction,
            ], 400);
        }
    }
}
