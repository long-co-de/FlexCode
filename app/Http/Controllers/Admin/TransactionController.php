<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\User;

class TransactionController extends Controller
{
    /**
     * Display a listing of the transactions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $type = $request->input('type');
        $status = $request->input('status');
        $user_id = $request->input('user_id');
        
        $query = Transaction::with('user');

        if ($user_id) {
            $query->where('user_id', $user_id);
        }
        
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('recipient', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }
        
        if ($type) {
            $query->where('type', $type);
        }
        
        if ($status) {
            $query->where('status', $status);
        }
        
        $transactions = $query->orderBy('created_at', 'desc')->paginate(15);
        
        // Get unique transaction types and statuses for filters
        $transactionTypes = Transaction::distinct()->pluck('type')->toArray();
        $statuses = Transaction::distinct()->pluck('status')->toArray();
        
        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'transactionTypes' => $transactionTypes,
            'statuses' => $statuses,
            'filter' => [
                'search' => $search,
                'type' => $type,
                'status' => $status,
                'user_id' => $user_id,
            ],
        ]);
    }

    /**
     * Display the specified transaction.
     *
     * @param  \App\Models\Transaction  $transaction
     * @return \Inertia\Response
     */
    public function show(Transaction $transaction)
    {
        $transaction->load('user');
        
        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Update the status of a transaction.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Transaction  $transaction
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateStatus(Request $request, Transaction $transaction)
    {
        $request->validate([
            'status' => 'required|string|in:pending,successful,failed',
        ]);
        
        $oldStatus = $transaction->status;
        $newStatus = $request->status;
        
        // If status is not changing, do nothing
        if ($oldStatus === $newStatus) {
            return redirect()->back()->with('info', 'Transaction status is already ' . $newStatus);
        }
        
        // Handle status change
        $transaction->status = $newStatus;
        
        // If transaction is being marked as failed and was previously pending
        if ($newStatus === 'failed' && $oldStatus === 'pending') {
            // Refund the user
            $user = User::find($transaction->user_id);
            if ($user) {
                $user->wallet_balance += $transaction->amount + $transaction->fee;
                $user->save();
            }
        }
        
        // If transaction is being marked as successful and was previously failed
        if ($newStatus === 'successful' && $oldStatus === 'failed') {
            // Deduct from user's wallet again
            $user = User::find($transaction->user_id);
            if ($user) {
                $user->wallet_balance -= $transaction->amount + $transaction->fee;
                $user->save();
            }
        }
        
        $transaction->save();
        
        // If this is an API transaction, try to update the status with the provider
        if (in_array($transaction->type, ['airtime', 'data', 'cable', 'electricity']) && $newStatus !== 'pending') {
            // This would be implemented to update the status with the API provider
            // For now, we'll just log it
            \Log::info('Transaction status updated: ' . $transaction->reference . ' - ' . $newStatus);
        }
        
        return redirect()->back()->with('success', 'Transaction status updated to ' . $newStatus);
    }
}