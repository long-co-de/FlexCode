<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

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

        // Automatically requery pending transactions for electricity services only (focus on electricity)
        if ($transaction->status === 'pending' && in_array($transaction->type, ['electricity', 'borrowing_electricity'])) {
            $this->requeryTransactionStatus($transaction);

            // Reload the transaction to get updated status
            $transaction->refresh();
        }

        return Inertia::render('User/TransactionDetails', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Requery transaction status from provider.
     *
     * @param  \App\Models\Transaction  $transaction
     * @return void
     */
    private function requeryTransactionStatus(Transaction $transaction)
    {
        try {
            $datavendroService = app(\App\Services\DatavendroService::class);

            // Get provider transaction ID from meta_data if available
            $apiId = $transaction->meta_data['api_transaction_id'] ??
                    $transaction->meta_data['api_ident'] ??
                    $transaction->meta_data['id'] ??
                    $transaction->meta_data['ident'] ??
                    $transaction->meta_data['api_id'] ?? null;

            if (!$apiId) {
                $metaData = $transaction->meta_data ?? [];
                $metaData['processing_stage'] = $metaData['processing_stage'] ?? 'awaiting_token';
                $metaData['requery_attempts'] = (int) ($metaData['requery_attempts'] ?? 0) + 1;
                $metaData['last_requery_at'] = now()->toISOString();
                $metaData['last_requery_summary'] = 'Skipped requery: missing provider transaction ID.';
                $transaction->meta_data = $metaData;
                $transaction->save();
                return;
            }

            // Determine the correct endpoint based on transaction type
            $endpoint = 'topup'; // Default for airtime
            if ($transaction->type === 'electricity' || $transaction->type === 'borrowing_electricity') {
                $endpoint = 'billpayment';
            } elseif ($transaction->type === 'cable') {
                $endpoint = 'cablesub';
            }

            $metaData = $transaction->meta_data ?? [];
            $metaData['requery_attempts'] = (int) ($metaData['requery_attempts'] ?? 0) + 1;
            $metaData['last_requery_at'] = now()->toISOString();
            $metaData['last_requery_endpoint'] = $endpoint;
            $metaData['last_requery_api_id'] = (string) $apiId;

            $response = $datavendroService->verifyTransaction($apiId, $endpoint);
            $metaData['last_requery_status_code'] = $response['http_status'] ?? null;

            if ($response['success']) {
                $transactionData = $response['data'];
                $metaData['api_status'] = $response['api_status'] ?? null;
                $metaData['api_response_received_at'] = now()->toISOString();

                // Check if we have a token in the response
                $token = $transactionData['token'] ??
                        $transactionData['Token'] ??
                        $transactionData['POWERTOKEN'] ??
                        ($transactionData['data']['token'] ??
                        ($transactionData['data']['Token'] ??
                        ($transactionData['data']['POWERTOKEN'] ?? null)));

                // Clean token by removing "Token : " prefix if present
                if (!empty($token) && str_starts_with($token, 'Token : ')) {
                    $cleanToken = substr($token, 8); // Remove "Token : " prefix
                    $metaData['token'] = $cleanToken;
                    $metaData['original_token'] = $token;
                } elseif (!empty($token)) {
                    $metaData['token'] = $token;
                }

                // Update transaction status based on provider response
                $status = $transactionData['Status']
                    ?? $transactionData['status']
                    ?? ($transactionData['data']['Status'] ?? ($transactionData['data']['status'] ?? null));
                if (is_string($status)) {
                    $status = strtolower($status);
                    $metaData['last_requery_summary'] = 'Provider status: ' . $status;

                    if ($status === 'success' || $status === 'successful') {
                        if (!empty($metaData['token'])) {
                            $transaction->status = 'successful';
                            $metaData['completed_at'] = now()->toISOString();
                            $metaData['processing_stage'] = 'completed';
                            $transaction->user->notify(new \App\Notifications\PurchaseConfirmation($transaction, $transaction->type));
                        } else {
                            $transaction->status = 'pending';
                            $metaData['processing_stage'] = 'awaiting_token';
                        }
                    } elseif ($status === 'failed' || $status === 'declined') {
                        $transaction->status = 'failed';
                        $metaData['processing_stage'] = 'failed';

                        // Refund the user if transaction failed
                        $user = $transaction->user;
                        $user->wallet_balance += $transaction->amount + $transaction->fee;
                        $user->save();
                    } else {
                        $metaData['processing_stage'] = 'awaiting_token';
                    }
                }

                $transaction->meta_data = $metaData;
                $transaction->save();
            } else {
                $metaData['last_requery_summary'] = $response['message'] ?? 'Provider verification failed';
                $transaction->meta_data = $metaData;
                $transaction->save();
            }
        } catch (\Exception $e) {
            Log::error('Failed to requery transaction status: ' . $e->getMessage(), [
                'transaction_id' => $transaction->id,
                'reference' => $transaction->reference
            ]);
        }
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
