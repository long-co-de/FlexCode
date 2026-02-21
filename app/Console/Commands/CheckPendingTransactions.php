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
            'skipped_missing_provider_id' => 0,
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

            $metaData = $transaction->meta_data ?? [];
            $apiId = $metaData['api_transaction_id']
                ?? $metaData['api_ident']
                ?? $metaData['id']
                ?? $metaData['ident']
                ?? $metaData['api_id']
                ?? $metaData['transaction_id']
                ?? null;

            if (!$apiId) {
                $this->warn('Skipping transaction ' . $transaction->reference . ' - missing provider transaction ID');
                $stats['skipped_missing_provider_id']++;

                $metaData['processing_stage'] = $metaData['processing_stage'] ?? 'awaiting_token';
                $metaData['requery_attempts'] = (int) ($metaData['requery_attempts'] ?? 0) + 1;
                $metaData['last_requery_at'] = now()->toISOString();
                $metaData['last_requery_summary'] = 'Skipped requery: missing provider transaction ID.';
                $transaction->meta_data = $metaData;
                $transaction->save();
                continue;
            }

            // Since we're only processing electricity transactions, we can simplify
            // Determine the correct endpoint based on transaction type
            $endpoint = 'billpayment'; // Default for electricity

            $metaData['requery_attempts'] = (int) ($metaData['requery_attempts'] ?? 0) + 1;
            $metaData['last_requery_at'] = now()->toISOString();
            $metaData['last_requery_endpoint'] = $endpoint;
            $metaData['last_requery_api_id'] = (string) $apiId;

            $response = $datavendroService->verifyTransaction($apiId, $endpoint);
            $metaData['last_requery_status_code'] = $response['http_status'] ?? null;

            if (!$response['success']) {
                $this->warn('Failed to verify transaction ' . $transaction->reference . ': ' . ($response['message'] ?? 'Unknown error'));
                $metaData['last_requery_summary'] = $response['message'] ?? 'Provider verification failed';
                $transaction->meta_data = $metaData;
                $transaction->save();
                $stats['errors']++;
                continue;
            }

            $transactionData = $response['data'];
            $metaData['api_status'] = $response['api_status'] ?? null;
            $metaData['api_response_received_at'] = now()->toISOString();

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

            $status = $transactionData['Status']
                ?? $transactionData['status']
                ?? ($transactionData['data']['Status'] ?? ($transactionData['data']['status'] ?? null));

            // Update transaction status
            if (is_string($status)) {
                $status = strtolower($status);
                $metaData['last_requery_summary'] = 'Provider status: ' . $status;
                if ($status === 'success' || $status === 'successful') {
                    if (!empty($metaData['token'])) {
                        $transaction->status = 'successful';
                        $metaData['completed_at'] = now()->toISOString();
                        $metaData['processing_stage'] = 'completed';
                        $this->info('Transaction ' . $transaction->reference . ' marked as successful');
                        $stats['successful']++;

                        try {
                            $transaction->user->notify(new \App\Notifications\PurchaseConfirmation($transaction, $transaction->type));
                        } catch (\Exception $e) {
                            $this->warn('Failed to send notification for transaction ' . $transaction->reference . ': ' . $e->getMessage());
                        }
                    } else {
                        $transaction->status = 'pending';
                        $metaData['processing_stage'] = 'awaiting_token';
                        $this->info('Transaction ' . $transaction->reference . ' is successful at provider but awaiting token');
                        $stats['still_pending']++;
                    }
                } elseif ($status === 'failed' || $status === 'declined') {
                    $transaction->status = 'failed';
                    $metaData['processing_stage'] = 'failed';
                    $stats['failed']++;

                    // Refund the user if transaction failed
                    $user = $transaction->user;
                    $user->wallet_balance += $transaction->amount + $transaction->fee;
                    $user->save();

                    $this->info('Transaction ' . $transaction->reference . ' marked as failed and refunded');
                } else {
                    $this->info('Transaction ' . $transaction->reference . ' still pending');
                    $metaData['processing_stage'] = 'awaiting_token';
                    $metaData['last_requery_summary'] = 'Still pending at provider';
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
        $this->info("Skipped (missing provider ID): {$stats['skipped_missing_provider_id']}");
        $this->info("Errors: {$stats['errors']}");
        $this->info('================================');

        $this->info('Transaction check completed successfully!');
        return 0;
    }
}
