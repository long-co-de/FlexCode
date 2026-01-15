<?php

namespace App\Console\Commands;

use App\Models\Borrowing;
use App\Notifications\BorrowingPaymentReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendBorrowingPaymentReminders extends Command
{
    protected $signature = 'borrowing:send-reminders {--days=3 : Number of days before due date to send reminder}';
    protected $description = 'Send payment reminders for upcoming borrowing repayments';

    public function handle()
    {
        $daysBeforeDue = $this->option('days');
        $this->info("🔔 Sending payment reminders for borrowings due in {$daysBeforeDue} days...");

        try {
            $dueDate = now()->addDays($daysBeforeDue)->toDateString();
            $borrowings = Borrowing::where('status', 'active')
                ->whereDate('due_date', '=', $dueDate)
                ->with('user')
                ->get();

            if ($borrowings->isEmpty()) {
                $this->info('✓ No borrowings due in ' . $daysBeforeDue . ' days.');
                return 0;
            }

            $sent = 0;
            foreach ($borrowings as $borrowing) {
                try {
                    $daysRemaining = now()->diffInDays($borrowing->due_date);
                    $borrowing->user->notify(new BorrowingPaymentReminder($borrowing, $daysRemaining));
                    
                    Log::info("Payment reminder sent for borrowing {$borrowing->id}", [
                        'user_id' => $borrowing->user_id,
                        'due_date' => $borrowing->due_date,
                        'days_remaining' => $daysRemaining,
                    ]);
                    
                    $sent++;
                    $this->line("✓ Reminder sent to {$borrowing->user->name} ({$borrowing->user->email})");
                } catch (\Exception $e) {
                    Log::error("Failed to send reminder for borrowing {$borrowing->id}: " . $e->getMessage());
                    $this->error("✗ Failed for borrowing {$borrowing->id}: " . $e->getMessage());
                }
            }

            $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->info("✓ Payment reminders sent: {$sent}");
            
            return 0;
        } catch (\Exception $e) {
            Log::error('Payment reminder command failed: ' . $e->getMessage());
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
