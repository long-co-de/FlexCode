<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use App\Models\Network;
use App\Models\DataPlan;
use App\Models\Transaction;
use App\Services\DatavendroService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Traits\ProProfitCalculator;

class DataController extends AtomicController
{
    use ProProfitCalculator;

    protected $datavendroService;

    public function __construct(DatavendroService $datavendroService)
    {
        $this->datavendroService = $datavendroService;
    }

    /**
     * Get data plans for a specific network.
     *
     * @param  string  $network
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPlans($network)
    {
        $network = Network::where('code', $network)
            ->orWhere('id', $network)
            ->firstOrFail();

        $plans = DataPlan::where('network_id', $network->id)
            ->where('is_active', true)
            ->orderBy('amount', 'asc')
            ->get();

        return response()->json([
            'network' => $network,
            'plans' => $plans,
        ]);
    }

    /**
     * Process data plan purchase.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:data_plans,id',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'pin' => 'required|string|size:4',
            'request_id' => 'required|string|min:20',
        ]);

        $user = $request->user();

        // Deduplication check
        if ($this->isDuplicateRequest($request->request_id, $user->id, 'api_data_purchase')) {
            return response()->json(['message' => 'Duplicate request detected.'], 400);
        }

        // Rate limiting
        if ($this->isRateLimited($user->id, 'api_data_purchase')) {
            return response()->json(['message' => 'Too many requests. Please wait.'], 429);
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Invalid transaction PIN.'], 403);
        }

        $plan = DataPlan::with('network')->findOrFail($request->plan_id);

        // Check if the plan is active
        if (!$plan->is_active) {
            return response()->json([
                'message' => 'The selected data plan is currently unavailable.',
            ], 400);
        }

        try {
            $result = $this->processAtomicTransaction($user->id, $plan->selling_price, function ($lockedUser) use ($request, $plan) {
                // Generate unique reference
                $reference = 'DATA' . strtoupper(Str::random(8)) . time();

                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'data',
                    'amount' => $plan->selling_price,
                    'fee' => 0,
                    'status' => 'pending',
                    'recipient' => $request->phone_number,
                    'description' => $plan->network->name . ' ' . $plan->name . ' Data Purchase to ' . $request->phone_number,
                    'meta_data' => [
                        'network' => $plan->network->name,
                        'network_code' => $plan->network->code,
                        'plan_name' => $plan->name,
                        'plan_code' => $plan->code,
                        'plan_type' => $plan->plan_type,
                        'dataplan_id' => $plan->dataplan_id,
                        'phone_number' => $request->phone_number,
                        'amount' => $plan->selling_price,
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);

                // Deduct from user's wallet
                $this->deductWallet($lockedUser, $plan->selling_price, 'API data purchase');

                // Call external service
                $response = $this->datavendroService->buyData(
                    $request->phone_number,
                    $plan->network->code,
                    $plan->dataplan_id ?? $plan->code,
                    $reference,
                    false
                );

                if ($response['success']) {
                    // Update transaction status
                    $transaction->status = 'successful';
                    $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                        'api_response' => $response['data'] ?? null,
                        'api_transaction_id' => $response['api_transaction_id']
                            ?? ($response['data']['id'] ?? ($response['data']['ident'] ?? null)),
                        'api_status' => $response['api_status'] ?? null,
                        'completed_at' => now(),
                    ]);
                    $transaction->save();

                    // Calculate and record system profit
                    $profit = $this->calculateProfitMargin($plan->selling_price, 'data');
                    $transaction->profit = $profit;
                    $transaction->save();

                    $this->recordSystemProfit($transaction, $profit, 'data');

                    return [
                        'success' => true,
                        'message' => 'Data purchase successful!',
                        'transaction' => $transaction,
                    ];
                } else {
                    // If failed, refund the user
                    $lockedUser->wallet_balance += $plan->selling_price;
                    $lockedUser->save();

                    // Update transaction status
                    $transaction->status = 'failed';
                    $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                        'error_message' => $response['message'] ?? 'Unknown error'
                    ]);
                    $transaction->save();

                    throw new \Exception($response['message'] ?? 'Data purchase failed at provider.');
                }
            });

            return response()->json($result);

        } catch (\Exception $e) {
            // Log the error
            Log::error('API Data purchase error: ' . $e->getMessage());

            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
    protected function calculateProfitMargin($amount, $type = 'data')
    {
        return $this->isProUser()
            ? $this->getProProfitMargin($amount, 'data')
            : parent::calculateProfitMargin($amount, 'data');
    }
}
