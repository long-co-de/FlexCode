<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Update data plans from Datavendro API every 2 hours
        $schedule->command('vtu:update-data-plans')->everyTwoHours();

        // Update selling prices daily
        $schedule->command('vtu:update-prices')->dailyAt('01:30');

        // Check pending transactions status every 15 minutes
        $schedule->command('vtu:check-transactions')->everyFifteenMinutes();

        // Auto-Deduction: Dispatch jobs every hour (continuous processing)
        // This will dispatch jobs for all due borrowings every hour
        $schedule->call(function () {
            \App\Models\Borrowing::where('status', 'active')
                ->where('due_date', '<=', now())
                ->where('retry_count', '<', 3)
                ->orderBy('due_date', 'asc')
                ->get()
                ->each(function ($borrowing) {
                    // Dispatch auto-deduction job to queue
                    \App\Jobs\ProcessBorrowingAutoDeduction::dispatch($borrowing);
                });
        })->everyHour();

        // Borrowing Management (every day at 2:00 AM)
        $schedule->command('borrowing:handle-overdue')->dailyAt('02:00');

        // Send payment reminders (3 days before due date at 9:00 AM)
        $schedule->command('borrowing:send-reminders', ['--days=3'])->dailyAt('09:00');

        // Send urgent reminders (1 day before due date at 6:00 PM)
        $schedule->command('borrowing:send-reminders', ['--days=1'])->dailyAt('18:00');

        // Database backup
        $schedule->command('backup:clean')->dailyAt('02:00');
        $schedule->command('backup:run')->dailyAt('02:30');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
