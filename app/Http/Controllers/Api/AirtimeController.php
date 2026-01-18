<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use App\Models\Network;
use App\Models\Transaction;
use App\Services\DatavendroService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AirtimeController extends AtomicController
{
    protected $datavendroService;

    public function __construct(DatavendroService $datavendroService)
    {
        $this->datavendroService = $datavendroService;
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
            'pin' => 'required|string|size:4',
            'request_id' => 'required|string|min:20',
        ]);

        $user = $request->user();

        // Deduplication check
        if ($this->isDuplicateRequest($request->request_id, $user->id, 'api_airtime_purchase')) {
            return response()->json(['message' => 'Duplicate request detected.'], 400);
        }

        // Rate limiting
        if ($this->isRateLimited($user->id, 'api_airtime_purchase')) {
            return response()->json(['message' => 'Too many requests. Please wait.'], 429);
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Invalid transaction PIN.'], 403);
        }

        $network = Network::with('airtimeDiscount')->findOrFail($request->network_id);

        // Calculate amount to pay after discount
        $discount = $network->airtimeDiscount ? $network->airtimeDiscount->discount_percentage : 0;
        $discountAmount = ($request->amount * $discount) / 100;
        $amountToPay = $request->amount - $discountAmount;

        try {
            $result = $this->processAtomicTransaction($user->id, $amountToPay, function ($lockedUser) use ($request, $network, $amountToPay, $discount) {
                // Generate unique reference
                $reference = 'AIR' . strtoupper(Str::random(8)) . time();

                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
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
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);

                // Deduct from user's wallet
                $this->deductWallet($lockedUser, $amountToPay, 'API airtime purchase');

                // Call external service
                $response = $this->datavendroService->buyAirtime(
                    $request->phone_number,
                    $network->code,
                    $request->amount,
                    $reference,
                    'VTU',
                    false
                );

                if ($response['success']) {
                    $transaction->status = 'successful';
                    $transaction->save();
                    
                    return [
                        'success' => true,
                        'message' => 'Airtime purchase successful!',
                        'transaction' => $transaction,
                    ];
                } else {
                    // Refund if failed
                    $lockedUser->wallet_balance += $amountToPay;
                    $lockedUser->save();

                    $transaction->status = 'failed';
                    $transaction->meta_data = array_merge($transaction->meta_data ?? [], ['error' => $response['message'] ?? 'Unknown error']);
                    $transaction->save();

                    throw new \Exception($response['message'] ?? 'Airtime purchase failed at provider.');
                }
            });

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
