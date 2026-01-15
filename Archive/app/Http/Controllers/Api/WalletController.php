<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Str;

class WalletController extends Controller
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
     * Fund user's wallet.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function fund(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'payment_method' => 'required|in:card,bank_transfer,ussd',
        ]);
        
        $user = $request->user();
        $reference = 'FUND' . strtoupper(Str::random(8));
        
        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'wallet_funding',
            'amount' => $request->amount,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $user->id,
            'description' => 'Wallet Funding of ₦' . $request->amount,
            'meta_data' => [
                'payment_method' => $request->payment_method,
                'amount' => $request->amount,
            ],
        ]);
        
        // Here you would integrate with a payment gateway
        // For this example, we'll simulate a successful payment
        
        // Update transaction status
        $transaction->status = 'successful';
        $transaction->save();
        
        // Update user's wallet balance
        $user->wallet_balance += $request->amount;
        $user->save();
        
        return response()->json([
            'message' => 'Wallet funded successfully',
            'transaction' => $transaction,
            'new_balance' => $user->wallet_balance,
        ]);
    }

    /**
     * Transfer funds to another user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'recipient' => 'required|string|exists:users,email',
            'amount' => 'required|numeric|min:100',
        ]);
        
        $sender = $request->user();
        $recipient = User::where('email', $request->recipient)->first();
        
        if ($sender->id === $recipient->id) {
            return response()->json([
                'message' => 'You cannot transfer funds to yourself.',
            ], 400);
        }
        
        if ($sender->wallet_balance < $request->amount) {
            return response()->json([
                'message' => 'Insufficient wallet balance.',
            ], 400);
        }
        
        $reference = 'TRAN' . strtoupper(Str::random(8));
        
        // Create transaction record for sender
        $senderTransaction = Transaction::create([
            'user_id' => $sender->id,
            'reference' => $reference,
            'type' => 'wallet_transfer_out',
            'amount' => $request->amount,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $recipient->id,
            'description' => 'Wallet Transfer of ₦' . $request->amount . ' to ' . $recipient->name,
            'meta_data' => [
                'recipient_id' => $recipient->id,
                'recipient_name' => $recipient->name,
                'recipient_email' => $recipient->email,
                'amount' => $request->amount,
            ],
        ]);
        
        // Create transaction record for recipient
        $recipientTransaction = Transaction::create([
            'user_id' => $recipient->id,
            'reference' => $reference,
            'type' => 'wallet_transfer_in',
            'amount' => $request->amount,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $recipient->id,
            'description' => 'Wallet Transfer of ₦' . $request->amount . ' from ' . $sender->name,
            'meta_data' => [
                'sender_id' => $sender->id,
                'sender_name' => $sender->name,
                'sender_email' => $sender->email,
                'amount' => $request->amount,
            ],
        ]);
        
        // Update sender's wallet balance
        $sender->wallet_balance -= $request->amount;
        $sender->save();
        
        // Update recipient's wallet balance
        $recipient->wallet_balance += $request->amount;
        $recipient->save();
        
        // Update transaction statuses
        $senderTransaction->status = 'successful';
        $senderTransaction->save();
        
        $recipientTransaction->status = 'successful';
        $recipientTransaction->save();
        
        return response()->json([
            'message' => 'Funds transferred successfully',
            'transaction' => $senderTransaction,
            'new_balance' => $sender->wallet_balance,
        ]);
    }

    /**
     * Withdraw funds from wallet.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'bank_name' => 'required|string',
            'account_number' => 'required|string|size:10',
            'account_name' => 'required|string',
        ]);
        
        $user = $request->user();
        
        // Calculate withdrawal fee (if any)
        $fee = config('app.withdrawal_fee', 100);
        $totalAmount = $request->amount + $fee;
        
        if ($user->wallet_balance < $totalAmount) {
            return response()->json([
                'message' => 'Insufficient wallet balance.',
            ], 400);
        }
        
        $reference = 'WITH' . strtoupper(Str::random(8));
        
        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'wallet_withdrawal',
            'amount' => $request->amount,
            'fee' => $fee,
            'status' => 'pending',
            'recipient' => $request->account_number,
            'description' => 'Wallet Withdrawal of ₦' . $request->amount . ' to ' . $request->bank_name . ' - ' . $request->account_name,
            'meta_data' => [
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
                'account_name' => $request->account_name,
                'amount' => $request->amount,
                'fee' => $fee,
                'total_amount' => $totalAmount,
            ],
        ]);
        
        // Update user's wallet balance
        $user->wallet_balance -= $totalAmount;
        $user->save();
        
        // In a real application, you would integrate with a payment processor
        // to process the withdrawal to the user's bank account
        
        // For this example, we'll mark it as processing
        $transaction->status = 'processing';
        $transaction->save();
        
        return response()->json([
            'message' => 'Withdrawal request submitted successfully. It will be processed within 24 hours.',
            'transaction' => $transaction,
            'new_balance' => $user->wallet_balance,
        ]);
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