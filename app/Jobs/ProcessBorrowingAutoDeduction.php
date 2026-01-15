<?php

namespace App\Jobs;

use App\Models\Borrowing;
use App\Models\BorrowingRepayment;
use App\Services\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ProcessBorrowingAutoDeduction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $borrowing;
    protected $maxRetries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(Borrowing $borrowing)
    {
        $this->borrowing = $borrowing;
        // Process immediately on the default queue
        $this->queue = 'default';
    }

    /**
     * Execute the job.
     */
    public function handle(PaymentService $paymentService): void
    {
        $borrowing = $this->borrowing;
        $user = $borrowing->user;

        Log::info('Starting auto-deduction processing', [
            'borrowing_id' => $borrowing->id,
            'user_id' => $user->id,
            'reference' => $borrowing->reference,
            'amount' => $borrowing->total_amount,
        ]);

        // Verify borrowing is still due
        if ($borrowing->status !== 'active') {
            Log::info('Borrowing status changed, skipping auto-deduction', [
                'borrowing_id' => $borrowing->id,
                'current_status' => $borrowing->status,
            ]);
            return;
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

            Log::warning('No default card for auto-deduction', [
                'borrowing_id' => $borrowing->id,
                'user_id' => $user->id,
                'reference' => $borrowing->reference,
            ]);

            // Retry this job if not exceeded max retries
            if ($borrowing->retry_count < $this->maxRetries) {
                // Retry in 24 hours
                $this->release(now()->addHours(24));
            } else {
                // Mark as overdue if max retries exceeded
                $borrowing->status = 'overdue';
                $borrowing->save();

                // Notify user
                $user->notify(new \App\Notifications\BorrowingOverdue($borrowing));
            }
            return;
        }

        // Create repayment record
        $repayment = BorrowingRepayment::create([
            'borrowing_id' => $borrowing->id,
            'user_id' => $user->id,
            'card_id' => $defaultCard->id,
            'reference' => 'REP_' . Str::random(10),
            'amount' => $borrowing->total_amount,
            'payment_method' => 'card',
            'status' => 'pending',
        ]);

        try {
            // Use PaymentService to charge card
            $result = $paymentService->processBorrowingRepayment($borrowing);

            // Payment successful - mark borrowing as paid
            $borrowing->status = 'paid';
            $borrowing->repaid_at = now();
            $borrowing->payment_note = 'Auto-deducted successfully';
            $borrowing->save();

            $repayment->status = 'success';
            $repayment->save();

            Log::info('Auto-deduction successful', [
                'borrowing_id' => $borrowing->id,
                'user_id' => $user->id,
                'reference' => $borrowing->reference,
                'repayment_id' => $repayment->id,
            ]);

            // Notify user
            $user->notify(new \App\Notifications\BorrowingRepaymentSuccess($borrowing, $repayment));
        } catch (\Exception $e) {
            $repayment->status = 'failed';
            $repayment->payment_gateway_response = $e->getMessage();
            $repayment->save();

            // Update retry count
            $borrowing->retry_count++;
            $borrowing->last_retry_at = now();
            $borrowing->payment_note = 'Auto-deduction failed: ' . $e->getMessage();
            $borrowing->save();

            Log::warning('Auto-deduction failed', [
                'borrowing_id' => $borrowing->id,
                'user_id' => $user->id,
                'reference' => $borrowing->reference,
                'error' => $e->getMessage(),
                'retry_count' => $borrowing->retry_count,
            ]);

            // Retry job if max retries not exceeded
            if ($borrowing->retry_count < $this->maxRetries) {
                // Retry in 24 hours
                $this->release(now()->addHours(24));
            } else {
                // Mark as overdue if max retries exceeded
                $borrowing->status = 'overdue';
                $borrowing->save();

                Log::error('Auto-deduction max retries exceeded, marking as overdue', [
                    'borrowing_id' => $borrowing->id,
                    'user_id' => $user->id,
                    'reference' => $borrowing->reference,
                ]);

                // Notify user of overdue status
                $user->notify(new \App\Notifications\BorrowingOverdue($borrowing));
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Auto-deduction job failed', [
            'borrowing_id' => $this->borrowing->id,
            'user_id' => $this->borrowing->user_id,
            'error' => $exception->getMessage(),
        ]);

        // Increment retry count
        $this->borrowing->increment('retry_count');
        $this->borrowing->update(['last_retry_at' => now()]);
    }

    /**
     * Get the number of seconds to wait before retrying the job.
     */
    public function backoff(): array
    {
        // Wait 1 hour between retries
        return [3600, 3600, 3600];
    }

    /**
     * Determine the time at which the job should timeout.
     */
    public function timeout(): int
    {
        return 300; // 5 minutes
    }
}
