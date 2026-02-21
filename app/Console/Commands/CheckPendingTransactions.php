<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DatavendroService;
use App\Models\Transaction;
use App\Models\CronLog;
use Illuminate\Support\Facades\Log;

class CheckPendingTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vtu:check-transactions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check status of pending transactions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking pending transactions...');

        $datavendroService = app(DatavendroService::class);

        // Track statistics for logging
        $stats = [
            'total_checked' => 0,
            'successful' => 0,
            'failed' => 0,
            'still_pending' => 0,
            'tokens_found' => 0,
            'errors' => 0,
        ];

        // Get only pending electricity transactions (focus on electricity only as requested)
        $pendingTransactions = Transaction::where('status', 'pending')
            ->whereIn('type', ['electricity', 'borrowing_electricity'])
            ->where('created_at', '>=', now()->subDays(3)) // Only check transactions from the last 3 days
            ->get();

        $this->info('Found ' . $pendingTransactions->count() . ' pending transactions');
        $stats['total_checked'] = $pendingTransactions->count();

        foreach ($pendingTransactions as $transaction) {
            $this->info('Checking transaction: ' . $transaction->reference . ' (Type: ' . $transaction->type . ')');

            // Get API ID from meta_data if available - check multiple possible fields
            $apiId = $transaction->meta_data['api_transaction_id'] ??
                    $transaction->meta_data['id'] ??
                    $transaction->meta_data['ident'] ??
                    $transaction->meta_data['api_id'] ??
                    $transaction->meta_data['transaction_id'] ?? null;

            if (!$apiId && $transaction->type !== 'data') {
                $this->warn('No API ID found for transaction ' . $transaction->reference . ' - checking if we can use reference');

                // For some transactions, the reference might be the API ID
                if (str_starts_with($transaction->reference, 'ELEC') || str_starts_with($transaction->reference, 'CABLE') || str_starts_with($transaction->reference, 'AIRT')) {
                    $apiId = $transaction->reference;
                    $this->info('Using transaction reference as API ID: ' . $apiId);
                } else {
                    $this->warn('Skipping transaction ' . $transaction->reference . ' - no API ID available');
                    $stats['errors']++;
                    continue;
                }
            }

            // Since we're only processing electricity transactions, we can simplify
            // Determine the correct endpoint based on transaction type
            $endpoint = 'billpayment'; // Default for electricity

            // Initialize metadata at the beginning
            $metaData = $transaction->meta_data ?? [];

            // Store API request details before making the call
            $metaData['requery_requests'] = $metaData['requery_requests'] ?? [];
            $metaData['requery_requests'][] = [
                'timestamp' => now()->toISOString(),
                'request' => [
                    'api_id' => $apiId,
                    'endpoint' => $endpoint,
                    'method' => 'GET',
                    'url' => 'Datavendro API: ' . $endpoint . '/' . $apiId,
                    'transaction_type' => $transaction->type,
                    'transaction_reference' => $transaction->reference
                ]
            ];

            $response = $datavendroService->verifyTransaction($apiId, $endpoint);

            if (!$response['success']) {
                $this->warn('Failed to verify transaction ' . $transaction->reference . ': ' . ($response['message'] ?? 'Unknown error'));
                $stats['errors']++;
                continue;
            }

            $transactionData = $response['data'];

            // Store full API response in metadata
            $metaData['requery_responses'] = $metaData['requery_responses'] ?? [];
            $metaData['requery_responses'][] = [
                'timestamp' => now()->toISOString(),
                'response' => $transactionData
            ];
            $metaData['last_requery_at'] = now()->toISOString();

            // Check if we have a token in the response (for electricity transactions)
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
                $stats['tokens_found']++;
            } elseif (!empty($token)) {
                $metaData['token'] = $token;
                $stats['tokens_found']++;
            }

            // Update transaction status
            if (isset($transactionData['Status'])) {
                $status = strtolower($transactionData['Status']);

                if ($status === 'success' || $status === 'successful') {
                    $transaction->status = 'successful';
                    $metaData['completed_at'] = now()->toISOString();
                    $this->info('Transaction ' . $transaction->reference . ' marked as successful');
                    $stats['successful']++;

                    // Send notification for successful transactions
                    try {
                        $transaction->user->notify(new \App\Notifications\PurchaseConfirmation($transaction, $transaction->type));
                    } catch (\Exception $e) {
                        $this->warn('Failed to send notification for transaction ' . $transaction->reference . ': ' . $e->getMessage());
                    }
                } elseif ($status === 'failed' || $status === 'declined') {
                    $transaction->status = 'failed';
                    $stats['failed']++;

                    // Refund the user if transaction failed
                    $user = $transaction->user;
                    $user->wallet_balance += $transaction->amount + $transaction->fee;
                    $user->save();

                    $this->info('Transaction ' . $transaction->reference . ' marked as failed and refunded');
                } else {
                    $this->info('Transaction ' . $transaction->reference . ' still pending');
                    $stats['still_pending']++;
                }

                $transaction->meta_data = $metaData;
                $transaction->save();
            }
        }

        // Log execution to cron logs for admin dashboard
        try {
            CronLog::create([
                'command' => $this->signature,
                'started_at' => now(),
                'completed_at' => now(),
                'status' => 'success',
                'output' => json_encode([
                    'message' => 'Transaction check completed',
                    'statistics' => $stats,
                    'summary' => "Checked {$stats['total_checked']} transactions: {$stats['successful']} successful, {$stats['failed']} failed, {$stats['still_pending']} still pending, {$stats['tokens_found']} tokens found"
                ]),
            ]);
        } catch (\Exception $e) {
            $this->warn('Failed to log to cron logs: ' . $e->getMessage());
        }

        // Display summary statistics
        $this->info('=== Transaction Check Summary ===');
        $this->info("Total checked: {$stats['total_checked']}");
        $this->info("Successful: {$stats['successful']}");
        $this->info("Failed: {$stats['failed']}");
        $this->info("Still pending: {$stats['still_pending']}");
        $this->info("Tokens found: {$stats['tokens_found']}");
        $this->info("Errors: {$stats['errors']}");
        $this->info('================================');

        $this->info('Transaction check completed successfully!');
        return 0;
    }
}
