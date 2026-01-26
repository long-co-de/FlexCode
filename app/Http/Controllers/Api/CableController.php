<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use App\Models\CableProvider;
use App\Models\CablePlan;
use App\Models\Transaction;
use App\Services\DatavendroService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Traits\ProProfitCalculator;

class CableController extends AtomicController
{
    use ProProfitCalculator;

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
            'pin' => 'required|string|size:4',
            'request_id' => 'required|string|min:20',
        ]);

        $user = $request->user();

        // Deduplication check
        if ($this->isDuplicateRequest($request->request_id, $user->id, 'api_cable_purchase')) {
            return response()->json(['message' => 'Duplicate request detected.'], 400);
        }

        // Rate limiting
        if ($this->isRateLimited($user->id, 'api_cable_purchase')) {
            return response()->json(['message' => 'Too many requests. Please wait.'], 429);
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Invalid transaction PIN.'], 403);
        }

        $plan = CablePlan::with('provider')->findOrFail($request->plan_id);

        try {
            $result = $this->processAtomicTransaction($user->id, $plan->selling_price, function ($lockedUser) use ($request, $plan) {
                // Generate unique reference
                $reference = 'CABLE' . strtoupper(Str::random(8)) . time();

                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
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
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);

                // Deduct from user's wallet
                $this->deductWallet($lockedUser, $plan->selling_price, 'API cable purchase');

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

                    // Calculate and record system profit
                    $profit = $this->calculateProfitMargin($plan->selling_price, 'cable');
                    $transaction->profit = $profit;
                    $transaction->save();
                    
                    $this->recordSystemProfit($transaction, $profit, 'cable');

                    return [
                        'success' => true,
                        'message' => 'Cable subscription successful!',
                        'transaction' => $transaction,
                    ];
                } else {
                    // If failed, refund the user
                    $lockedUser->wallet_balance += $plan->selling_price;
                    $lockedUser->save();

                    // Update transaction status
                    $transaction->status = 'failed';
                    $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                        'error' => $response['message'] ?? 'Unknown error'
                    ]);
                    $transaction->save();

                    throw new \Exception($response['message'] ?? 'Cable subscription failed at provider.');
                }
            });

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    protected function calculateProfitMargin($amount, $type = 'cable')
    {
        return $this->isProUser()
            ? $this->getProProfitMargin($amount, 'cable')
            : parent::calculateProfitMargin($amount, 'cable');
    }
}
