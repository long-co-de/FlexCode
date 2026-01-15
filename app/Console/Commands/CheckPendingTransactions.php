<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DatavendroService;
use App\Services\HusmodataService;
use App\Models\Transaction;
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
        $husmodataService = app(HusmodataService::class);
        
        // Get all pending transactions that are not wallet funding
        $pendingTransactions = Transaction::where('status', 'pending')
            ->whereNotIn('type', ['wallet_funding', 'wallet_transfer', 'commission'])
            ->where('created_at', '>=', now()->subDays(3)) // Only check transactions from the last 3 days
            ->get();
        
        $this->info('Found ' . $pendingTransactions->count() . ' pending transactions');
        
        foreach ($pendingTransactions as $transaction) {
            $this->info('Checking transaction: ' . $transaction->reference);
            
            // Get API ID from meta_data if available
            $apiId = $transaction->meta_data['id'] ?? $transaction->meta_data['ident'] ?? $transaction->meta_data['api_id'] ?? null;
            
            if (!$apiId && $transaction->type !== 'data') {
                $this->warn('No API ID found for transaction ' . $transaction->reference);
                continue;
            }

            // Verify transaction status from API
            if ($transaction->type === 'data' || $transaction->type === 'borrowing_data') {
                // For data, try Husmodata first as requested
                $response = $husmodataService->verifyTransaction($apiId ?? $transaction->reference);
                
                // If Husmodata fails and it looks like an old transaction (has id/ident), try Datavendro
                if (!$response['success'] && (isset($transaction->meta_data['id']) || isset($transaction->meta_data['ident']))) {
                    $response = $datavendroService->verifyTransaction($apiId);
                }
            } else {
                // All other services (airtime, cable, electricity) use Datavendro
                $response = $datavendroService->verifyTransaction($apiId);
            }
            
            if (!$response['success']) {
                $this->warn('Failed to verify transaction ' . $transaction->reference . ': ' . ($response['message'] ?? 'Unknown error'));
                continue;
            }
            
            $transactionData = $response['data'];
            
            // Update transaction status
            if (isset($transactionData['Status'])) {
                $status = strtolower($transactionData['Status']);
                
                if ($status === 'success' || $status === 'successful') {
                    $transaction->status = 'successful';
                    $this->info('Transaction ' . $transaction->reference . ' marked as successful');
                } elseif ($status === 'failed' || $status === 'declined') {
                    $transaction->status = 'failed';
                    
                    // Refund the user if transaction failed
                    $user = $transaction->user;
                    $user->wallet_balance += $transaction->amount + $transaction->fee;
                    $user->save();
                    
                    $this->info('Transaction ' . $transaction->reference . ' marked as failed and refunded');
                } else {
                    $this->info('Transaction ' . $transaction->reference . ' still pending');
                }
                
                $transaction->save();
            }
        }
        
        $this->info('Transaction check completed successfully!');
        return 0;
    }
}