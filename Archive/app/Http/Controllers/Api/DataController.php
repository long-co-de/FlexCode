<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Network;
use App\Models\DataPlan;
use App\Models\Transaction;
use App\Services\HusmodataService;
use App\Services\WazobiaService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DataController extends Controller
{
    protected $husmodataService;
    protected $wazobiaService;

    public function __construct(HusmodataService $husmodataService, WazobiaService $wazobiaService)
    {
        $this->husmodataService = $husmodataService;
        $this->wazobiaService = $wazobiaService;
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
        ]);
        
        $user = $request->user();
        $plan = DataPlan::with('network')->findOrFail($request->plan_id);
        
        // Check if the plan is active
        if (!$plan->is_active) {
            return response()->json([
                'message' => 'The selected data plan is currently unavailable.',
            ], 400);
        }
        
        // Check if user has enough balance
        if ($user->wallet_balance < $plan->selling_price) {
            return response()->json([
                'message' => 'Insufficient wallet balance. Please fund your wallet.',
            ], 400);
        }
        
        // Generate unique reference
        $reference = 'DATA' . strtoupper(Str::random(8));
        
        // Use database transaction to ensure data consistency
        try {
            \DB::beginTransaction();
            
            // Create transaction record
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'reference' => $reference,
                'type' => 'data',
                'amount' => $plan->selling_price,
                'fee' => 0,
                'status' => 'pending',
                'recipient' => $request->phone_number,
                'description' => $plan->network->name . ' ' . $plan->name . ' Data Purchase to ' . $request->phone_number,
                'metadata' => [
                    'network' => $plan->network->name,
                    'network_code' => $plan->network->code,
                    'plan_name' => $plan->name,
                    'plan_code' => $plan->code,
                    'plan_type' => $plan->plan_type,
                    'dataplan_id' => $plan->dataplan_id,
                    'phone_number' => $request->phone_number,
                    'amount' => $plan->selling_price,
                ],
            ]);
            
            // Deduct from user's wallet
            $user->wallet_balance -= $plan->selling_price;
            $user->save();
            
            \DB::commit();
            
            $response = $this->wazobiaService->subscribeData(
                strtolower($plan->network->code),
                $plan->code,
                $request->phone_number
            );

            if (!$response['success']) {
                $response = $this->husmodataService->buyData(
                    $request->phone_number,
                    $plan->network->code,
                    $plan->code,
                    $reference
                );
            }
            
            if ($response['success']) {
                // Update transaction status
                $transaction->status = 'successful';
                $transaction->save();
                
                return response()->json([
                    'message' => 'Data purchase successful!',
                    'transaction' => $transaction,
                ]);
            } else {
                // If failed, refund the user
                \DB::beginTransaction();
                
                $user->refresh(); // Get the latest user data
                $user->wallet_balance += $plan->selling_price;
                $user->save();
                
                // Update transaction status
                $transaction->status = 'failed';
                $transaction->metadata = array_merge($transaction->metadata ?? [], [
                    'error_message' => $response['message'] ?? 'Unknown error'
                ]);
                $transaction->save();
                
                \DB::commit();
                
                return response()->json([
                    'message' => 'Data purchase failed: ' . ($response['message'] ?? 'Unknown error'),
                    'transaction' => $transaction,
                ], 400);
            }
        } catch (\Exception $e) {
            \DB::rollBack();
            
            // Log the error
            \Log::error('Data purchase error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'An error occurred while processing your request. Please try again later.',
            ], 500);
        }
    }
}
