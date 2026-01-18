<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class WalletController extends AtomicController
{
    /**
     * Get user's wallet balance.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function balance(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'balance' => $user->wallet_balance,
        ]);
    }

    /**
     * Fund user's wallet (Initialize or process).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function fund(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'payment_method' => 'required|in:card,bank_transfer,ussd',
            'request_id' => 'required|string|min:20',
        ]);
        
        $user = $request->user();

        // Deduplication check
        if ($this->isDuplicateRequest($request->request_id, $user->id, 'api_fund')) {
            return response()->json(['message' => 'Duplicate request detected.'], 400);
        }
        
        try {
            $result = $this->processAtomicTransaction($user->id, 0, function ($lockedUser) use ($request) {
                $reference = 'FUND' . strtoupper(Str::random(8)) . time();
                
                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'wallet_funding',
                    'amount' => $request->amount,
                    'fee' => 0,
                    'status' => 'successful',
                    'recipient' => $lockedUser->email,
                    'description' => 'API Wallet Funding of ₦' . $request->amount,
                    'meta_data' => [
                        'payment_method' => $request->payment_method,
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);
                
                // Update user's wallet balance
                $lockedUser->wallet_balance += $request->amount;
                $lockedUser->save();

                return [
                    'transaction' => $transaction,
                    'new_balance' => $lockedUser->wallet_balance,
                ];
            });

            return response()->json([
                'message' => 'Wallet funded successfully',
                'transaction' => $result['transaction'],
                'new_balance' => $result['new_balance'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Transfer funds to another user with atomic safety.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'recipient_email' => 'required|string|exists:users,email',
            'amount' => 'required|numeric|min:100|max:1000000',
            'pin' => 'required|string|size:4',
            'request_id' => 'required|string|min:20',
        ]);
        
        $sender = $request->user();

        // Deduplication check
        if ($this->isDuplicateRequest($request->request_id, $sender->id, 'api_wallet_transfer')) {
            return response()->json(['message' => 'Duplicate request detected.'], 400);
        }

        // Rate limiting
        if ($this->isRateLimited($sender->id, 'api_wallet_transfer')) {
            return response()->json(['message' => 'Too many requests. Please wait.'], 429);
        }

        // Verify PIN
        if (!Hash::check($request->pin, $sender->pin)) {
            return response()->json(['message' => 'Invalid transaction PIN.'], 403);
        }

        $recipient = User::where('email', $request->recipient_email)->first();
        
        if ($sender->id === $recipient->id) {
            return response()->json(['message' => 'You cannot transfer funds to yourself.'], 400);
        }
        
        try {
            $result = $this->processAtomicTransaction($sender->id, $request->amount, function ($lockedSender) use ($request, $recipient) {
                
                // Check recipient's wallet limit
                $maxWalletBalance = (float) Setting::get('max_wallet_balance', 1000000);
                if (($recipient->wallet_balance + $request->amount) > $maxWalletBalance) {
                    throw new \Exception('Recipient has reached maximum wallet limit.');
                }

                $reference = 'TRAN' . strtoupper(Str::random(8)) . time();
                
                // Create transaction records
                $senderTransaction = Transaction::create([
                    'user_id' => $lockedSender->id,
                    'reference' => $reference . '-S',
                    'type' => 'wallet_transfer',
                    'amount' => $request->amount,
                    'fee' => 0,
                    'status' => 'successful',
                    'recipient' => $recipient->email,
                    'description' => 'API Wallet Transfer of ₦' . $request->amount . ' to ' . $recipient->name,
                    'meta_data' => [
                        'recipient_id' => $recipient->id,
                        'recipient_name' => $recipient->name,
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);

                Transaction::create([
                    'user_id' => $recipient->id,
                    'reference' => $reference . '-R',
                    'type' => 'wallet_transfer',
                    'amount' => $request->amount,
                    'fee' => 0,
                    'status' => 'successful',
                    'recipient' => $recipient->email,
                    'description' => 'API Wallet Transfer of ₦' . $request->amount . ' from ' . $lockedSender->name,
                    'meta_data' => [
                        'sender_id' => $lockedSender->id,
                        'sender_name' => $lockedSender->name,
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);

                // Deduct from sender
                $this->deductWallet($lockedSender, $request->amount, 'API wallet transfer');
                
                // Credit to recipient
                DB::table('users')
                    ->where('id', $recipient->id)
                    ->lockForUpdate()
                    ->increment('wallet_balance', $request->amount);

                return [
                    'transaction' => $senderTransaction,
                    'new_balance' => $lockedSender->wallet_balance,
                ];
            });

            return response()->json([
                'message' => 'Funds transferred successfully',
                'transaction' => $result['transaction'],
                'new_balance' => $result['new_balance'],
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Withdraw funds from wallet with atomic safety.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function withdraw(Request $request)
    {
        $minWithdrawalAmount = Setting::get('min_withdrawal_amount', 1000);

        $request->validate([
            'amount' => 'required|numeric|min:' . $minWithdrawalAmount,
            'bank_name' => 'required|string',
            'account_number' => 'required|string|size:10',
            'account_name' => 'required|string',
            'pin' => 'required|string|size:4',
            'request_id' => 'required|string|min:20',
        ]);
        
        $user = $request->user();

        // Deduplication check
        if ($this->isDuplicateRequest($request->request_id, $user->id, 'api_withdrawal')) {
            return response()->json(['message' => 'Duplicate request detected.'], 400);
        }

        // Rate limiting
        if ($this->isRateLimited($user->id, 'api_withdrawal')) {
            return response()->json(['message' => 'Too many requests. Please wait.'], 429);
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Invalid transaction PIN.'], 403);
        }
        
        try {
            $result = $this->processAtomicTransaction($user->id, $request->amount, function ($lockedUser) use ($request) {
                
                $reference = 'WITH' . strtoupper(Str::random(8)) . time();
                
                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'withdrawal',
                    'amount' => $request->amount,
                    'fee' => 0,
                    'status' => 'pending',
                    'recipient' => $request->account_number,
                    'description' => 'API Wallet Withdrawal of ₦' . $request->amount . ' to ' . $request->bank_name,
                    'meta_data' => [
                        'bank_name' => $request->bank_name,
                        'account_number' => $request->account_number,
                        'account_name' => $request->account_name,
                        'request_id' => $request->request_id,
                        'channel' => 'api',
                    ],
                ]);

                // Deduct from wallet
                $this->deductWallet($lockedUser, $request->amount, 'API withdrawal');

                return $transaction;
            });

            return response()->json([
                'message' => 'Withdrawal request submitted successfully',
                'transaction' => $result,
                'new_balance' => $user->fresh()->wallet_balance,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get user's wallet transaction history.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function history(Request $request)
    {
        $user = $request->user();
        
        $transactions = Transaction::where('user_id', $user->id)
            ->whereIn('type', [
                'wallet_funding',
                'wallet_transfer_in',
                'wallet_transfer_out',
                'wallet_withdrawal',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        return response()->json([
            'transactions' => $transactions,
        ]);
    }
}