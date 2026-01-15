<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Network;
use App\Models\Transaction;
use App\Services\HusmodataService;
use App\Services\WazobiaService;
use Illuminate\Support\Str;

class AirtimeController extends Controller
{
    protected $husmodataService;
    protected $wazobiaService;

    public function __construct(HusmodataService $husmodataService, WazobiaService $wazobiaService)
    {
        $this->husmodataService = $husmodataService;
        $this->wazobiaService = $wazobiaService;
    }

    /**
     * Get all available networks.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNetworks()
    {
        $networks = Network::with('airtimeDiscount')
            ->where('is_active', true)
            ->get();
        
        return response()->json([
            'networks' => $networks,
        ]);
    }

    /**
     * Process airtime purchase.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'network_id' => 'required|exists:networks,id',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'amount' => 'required|numeric|min:50|max:50000',
        ]);
        
        $user = $request->user();
        $network = Network::with('airtimeDiscount')->findOrFail($request->network_id);
        
        // Calculate amount to pay after discount
        $discount = $network->airtimeDiscount ? $network->airtimeDiscount->discount_percentage : 0;
        $discountAmount = ($request->amount * $discount) / 100;
        $amountToPay = $request->amount - $discountAmount;
        
        // Check if user has enough balance
        if ($user->wallet_balance < $amountToPay) {
            return response()->json([
                'message' => 'Insufficient wallet balance. Please fund your wallet.',
            ], 400);
        }
        
        // Generate unique reference
        $reference = 'AIR' . strtoupper(Str::random(8));
        
        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'airtime',
            'amount' => $amountToPay,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $request->phone_number,
            'description' => $network->name . ' Airtime Purchase of ₦' . $request->amount . ' to ' . $request->phone_number,
            'meta_data' => [
                'network' => $network->name,
                'network_code' => $network->code,
                'phone_number' => $request->phone_number,
                'amount' => $request->amount,
                'discount' => $discount,
                'amount_paid' => $amountToPay,
            ],
        ]);
        
        // Deduct from user's wallet
        $user->wallet_balance -= $amountToPay;
        $user->save();
        
        $response = $this->wazobiaService->topupAirtime(
            strtolower($network->code),
            $request->phone_number,
            $request->amount,
            'VTU'
        );

        if (!$response['success']) {
            $response = $this->husmodataService->buyAirtime(
                $request->phone_number,
                $network->code,
                $request->amount,
                $reference
            );
        }
        
        if ($response['success']) {
            // Update transaction status
            $transaction->status = 'successful';
            $transaction->save();
            
            return response()->json([
                'message' => 'Airtime purchase successful!',
                'transaction' => $transaction,
            ]);
        } else {
            // If failed, refund the user
            $user->wallet_balance += $amountToPay;
            $user->save();
            
            // Update transaction status
            $transaction->status = 'failed';
            $transaction->save();
            
            return response()->json([
                'message' => 'Airtime purchase failed: ' . ($response['message'] ?? 'Unknown error'),
                'transaction' => $transaction,
            ], 400);
        }
    }
}
