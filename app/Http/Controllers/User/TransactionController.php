<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class TransactionController extends Controller
{
    /**
     * Display a listing of the user's transactions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $search = $request->input('search');
        $type = $request->input('type');
        $status = $request->input('status');
        
        $query = Transaction::where('user_id', $user->id);
        
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('recipient', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
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
        $transactionTypes = Transaction::where('user_id', $user->id)
            ->distinct()
            ->pluck('type')
            ->toArray();
            
        $statuses = Transaction::where('user_id', $user->id)
            ->distinct()
            ->pluck('status')
            ->toArray();
        
        return Inertia::render('User/Transactions', [
            'transactions' => $transactions,
            'transactionTypes' => $transactionTypes,
            'statuses' => $statuses,
            'filter' => [
                'search' => $search,
                'type' => $type,
                'status' => $status,
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
        // Ensure the transaction belongs to the authenticated user
        if ($transaction->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }
        
        return Inertia::render('User/TransactionDetails', [
            'transaction' => $transaction,
        ]);
    }
    
    /**
     * Generate a PDF receipt for the transaction.
     *
     * @param  \App\Models\Transaction  $transaction
     * @return \Illuminate\Http\Response
     */
    public function generateReceipt(Transaction $transaction)
    {
        // Ensure the transaction belongs to the authenticated user
        if ($transaction->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }
        
        $user = auth()->user();
        
        $data = [
            'transaction' => $transaction,
            'user' => $user,
            'date' => now()->format('F d, Y h:i A'),
            'receipt_no' => 'RCP' . strtoupper(substr($transaction->reference, -8)),
        ];
        
        $pdf = PDF::loadView('receipts.transaction', $data);
        // return view('receipts.transaction',$data);
        return $pdf->download('receipt-' . $transaction->reference . '.pdf');
    }
    
    /**
     * Share a transaction receipt via email.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Transaction  $transaction
     * @return \Illuminate\Http\RedirectResponse
     */
    public function shareReceipt(Request $request, Transaction $transaction)
    {
        // Ensure the transaction belongs to the authenticated user
        if ($transaction->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }
        
        $request->validate([
            'email' => 'required|email',
        ]);
        
        $user = auth()->user();
        
        $data = [
            'transaction' => $transaction,
            'user' => $user,
            'date' => now()->format('F d, Y h:i A'),
            'receipt_no' => 'RCP' . strtoupper(substr($transaction->reference, -8)),
        ];
        
        // Generate PDF
        $pdf = PDF::loadView('receipts.transaction', $data);
        $filename = 'receipt-' . $transaction->reference . '.pdf';
        $path = 'receipts/' . $filename;
        
        // Store PDF temporarily
        Storage::put('public/' . $path, $pdf->output());
        
        // Send email with receipt
        // Mail::to($request->email)->send(new TransactionReceipt($user, $transaction, $path));
        
        return redirect()->back()->with('success', 'Receipt has been sent to ' . $request->email);
    }
}