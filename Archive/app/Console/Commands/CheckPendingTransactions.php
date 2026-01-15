<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
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
        
        $husmodataService = app(HusmodataService::class);
        
        // Get all pending transactions that are not wallet funding
        $pendingTransactions = Transaction::where('status', 'pending')
            ->whereNotIn('type', ['wallet_funding', 'wallet_transfer', 'commission'])
            ->where('created_at', '>=', now()->subDays(3)) // Only check transactions from the last 3 days
            ->get();
        
        $this->info('Found ' . $pendingTransactions->count() . ' pending transactions');
        
        foreach ($pendingTransactions as $transaction) {
            $this->info('Checking transaction: ' . $transaction->reference);
            
            // Verify transaction status from API
            $response = $husmodataService->verifyTransaction($transaction->reference);
            
            if (!$response['success']) {
                $this->warn('Failed to verify transaction ' . $transaction->reference . ': ' . ($response['message'] ?? 'Unknown error'));
                continue;
            }
            
            $transactionData = $response['data'];
            
            // Update transaction status
            if (isset($transactionData['status'])) {
                $status = strtolower($transactionData['status']);
                
                if ($status === 'successful' || $status === 'completed') {
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