<?php

namespace App\Console\Commands;

use App\Models\Borrowing;
use App\Services\CronLogService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class HandleOverdueBorrowings extends Command
{
    protected $signature = 'borrowing:handle-overdue';
    protected $description = 'Mark overdue borrowings and apply penalties';
    protected $cronLog;

    public function __construct()
    {
        parent::__construct();
        $this->cronLog = new CronLogService();
    }

    public function handle()
    {
        $this->cronLog->startLog($this->signature);
        $this->info('⏰ Checking for overdue borrowings...');

        // Find borrowings that are past due date but still active
        $overdues = Borrowing::where('status', 'active')
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get();

        if ($overdues->isEmpty()) {
            $this->info('✓ No overdue borrowings found.');
            return 0;
        }

        $marked = 0;
        $notified = 0;

        foreach ($overdues as $borrowing) {
            try {
                // Mark as overdue
                $borrowing->status = 'overdue';
                $borrowing->save();
                $marked++;

                // Log the overdue event
                Log::warning('Borrowing marked as overdue', [
                    'borrowing_id' => $borrowing->id,
                    'user_id' => $borrowing->user_id,
                    'reference' => $borrowing->reference,
                    'due_date' => $borrowing->due_date,
                    'amount_due' => $borrowing->total_amount,
                    'days_overdue' => now()->diffInDays($borrowing->due_date),
                ]);

                // Send notification to user
                $this->notifyUser($borrowing);
                $notified++;

                $this->info("✓ Marked {$borrowing->reference} as overdue");

            } catch (\Exception $e) {
                $this->error("⚠ Failed to process {$borrowing->reference}: " . $e->getMessage());
                Log::error('Error handling overdue borrowing', [
                    'borrowing_id' => $borrowing->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->line('');
        $this->info('📊 Overdue Processing Summary:');
        $this->info("  Total Marked: {$marked}");
        $this->info("  Notifications Sent: {$notified}");

        Log::info('Overdue borrowing processing complete', [
            'marked' => $marked,
            'notified' => $notified,
        ]);

        // Log to cron_logs table
        $this->cronLog->finishSuccess([
            'processed' => $marked,
            'succeeded' => $notified,
        ]);

        return 0;
    }

    private function notifyUser(Borrowing $borrowing)
    {
        $user = $borrowing->user;
        $daysOverdue = now()->diffInDays($borrowing->due_date);

        try {
            // Send overdue notification using Laravel's notification system
            $user->notify(new \App\Notifications\BorrowingOverdueNotice($borrowing, $daysOverdue));
            
            Log::info('Overdue notification sent', [
                'user_id' => $user->id,
                'borrowing_id' => $borrowing->id,
                'days_overdue' => $daysOverdue,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send overdue notification', [
                'user_id' => $user->id,
                'borrowing_id' => $borrowing->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
