<?php

namespace App\Console\Commands;

use App\Models\Borrowing;
use App\Models\BorrowingRepayment;
use App\Services\PaymentService;
use App\Services\CronLogService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ProcessBorrowingRepayments extends Command
{
    protected $signature = 'borrowing:process-repayments {--max-retries=3}';
    protected $description = 'Process auto-deduction for due borrowing repayments';
    protected $paymentService;
    protected $cronLog;

    public function __construct(PaymentService $paymentService)
    {
        parent::__construct();
        $this->paymentService = $paymentService;
        $this->cronLog = new CronLogService();
    }

    public function handle()
    {
        $this->cronLog->startLog($this->signature);
        $this->info('🔄 Starting borrowing repayment processing...');
        $maxRetries = $this->option('max-retries');

        // Get borrowings due for repayment (not yet attempted beyond max retries)
        $borrowings = Borrowing::where('status', 'active')
            ->where('auto_deduction_enabled', true)
            ->where('due_date', '<=', now())
            ->where('retry_count', '<', $maxRetries)
            ->orderBy('due_date', 'asc')
            ->get();

        if ($borrowings->isEmpty()) {
            $this->info('✓ No pending repayments found.');
            return 0;
        }

        $processed = 0;
        $succeeded = 0;
        $failed = 0;
        $noCard = 0;

        foreach ($borrowings as $borrowing) {
            $processed++;
            try {
                $result = $this->processBorrowingRepayment($borrowing, $maxRetries);
                
                if ($result['success']) {
                    $succeeded++;
                    $this->info("✓ [{$processed}/{$borrowings->count()}] Processed: {$borrowing->reference}");
                } else {
                    if ($result['reason'] === 'no_card') {
                        $noCard++;
                    } else {
                        $failed++;
                    }
                    $this->warn("✗ [{$processed}/{$borrowings->count()}] {$result['message']}");
                }
            } catch (\Exception $e) {
                $failed++;
                $this->error("⚠ [{$processed}/{$borrowings->count()}] Exception for {$borrowing->reference}: " . $e->getMessage());
                Log::error("Borrowing repayment exception", [
                    'borrowing_id' => $borrowing->id,
                    'user_id' => $borrowing->user_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->line('');
        $this->info('📊 Processing Summary:');
        $this->info("  Total Processed: {$processed}");
        $this->info("  ✓ Succeeded: {$succeeded}");
        $this->info("  ✗ Failed: {$failed}");
        $this->info("  ⚠ No Card: {$noCard}");

        Log::info('Borrowing repayment processing complete', [
            'processed' => $processed,
            'succeeded' => $succeeded,
            'failed' => $failed,
            'no_card' => $noCard,
        ]);

        // Log to cron_logs table
        $this->cronLog->finishSuccess([
            'processed' => $processed,
            'succeeded' => $succeeded,
            'failed' => $failed,
        ]);

        return $failed > 0 ? 1 : 0;
    }

    private function processBorrowingRepayment(Borrowing $borrowing, int $maxRetries): array
    {
        $user = $borrowing->user;

        // Check if max retries reached
        if ($borrowing->retry_count >= $maxRetries) {
            $borrowing->status = 'failed';
            $borrowing->payment_note = 'Max retry attempts reached';
            $borrowing->save();

            return [
                'success' => false,
                'reason' => 'max_retries',
                'message' => "Max retries reached for borrowing {$borrowing->reference}",
            ];
        }

        // Get user's default card
        $defaultCard = $user->cards()
            ->where('is_default', true)
            ->where('is_active', true)
            ->first();

        if (!$defaultCard) {
            $borrowing->retry_count++;
            $borrowing->last_retry_at = now();
            $borrowing->payment_note = 'No active default card found';
            $borrowing->save();

            Log::warning("No default card for borrowing", [
                'borrowing_id' => $borrowing->id,
                'user_id' => $user->id,
                'reference' => $borrowing->reference,
            ]);

            return [
                'success' => false,
                'reason' => 'no_card',
                'message' => "No card for {$borrowing->reference}",
            ];
        }

        try {
            // Use PaymentService to charge card and update records atomically
            $result = $this->paymentService->processBorrowingRepayment($borrowing);

            if ($result['success']) {
                return [
                    'success' => true,
                    'message' => "Successfully processed {$borrowing->reference}",
                ];
            } else {
                throw new \Exception($result['message'] ?? 'Payment failed');
            }

        } catch (\Exception $e) {

            // Update retry count
            $borrowing->retry_count++;
            $borrowing->last_retry_at = now();
            $borrowing->payment_note = "Attempt {$borrowing->retry_count}: {$e->getMessage()}";
            $borrowing->save();

            return [
                'success' => false,
                'reason' => 'payment_failed',
                'message' => "{$borrowing->reference}: {$e->getMessage()}",
            ];
        }
    }
}
