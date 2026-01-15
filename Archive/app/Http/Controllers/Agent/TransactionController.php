<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\TransactionStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TransactionController extends Controller
{
    /**
     * Display a listing of the transactions.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'date_from', 'date_to']);

        $query = Transaction::with('user:id,name,email')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('reference', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($query) use ($search) {
                            $query->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($filters['date_from'] ?? null, function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($filters['date_to'] ?? null, function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            });

        $transactions = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Agent/Transactions', [
            'auth' => [
                'user' => Auth::user(),
            ],
            'transactions' => $transactions,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified transaction.
     */
    public function show(Transaction $transaction)
    {
        $transaction->load('user:id,name,email');

        return Inertia::render('Agent/TransactionDetails', [
            'auth' => [
                'user' => Auth::user(),
            ],
            'transaction' => $transaction,
        ]);
    }

    /**
     * Update the transaction status.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'status' => 'required|in:success,failed',
            'notes' => 'nullable|string|max:255',
        ]);

        $agent = Auth::user();

        // Update the transaction
        $transaction->update([
            'status' => $validated['status'] == 'success'  ? 'successful' : $validated['status'],
            'notes' => $validated['notes'],
            'verified_by' => $agent->id,
            'verified_at' => now(),
        ]);

        // If the transaction was successful and it's a wallet funding, update the user's wallet balance
        if ($validated['status'] === 'success' && $transaction->type === 'wallet_funding') {
            $user = User::find($transaction->user_id);
            $user->wallet_balance += $transaction->amount;
            $user->save();
        }

        // Notify the user
        $user = User::find($transaction->user_id);
        $user->notify(new TransactionStatusUpdated($transaction));

        return redirect()->route('agent.transactions')->with('success', 'Transaction status updated successfully.');
    }
}
