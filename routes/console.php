<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Update data plans from Datavendro API every 2 hours
Schedule::command('vtu:update-data-plans')->weekly();

// Cleanup non-working data plans every 2 hours
Schedule::command('vtu:cleanup-data-plans')->everyTwoHours();

// Update selling prices daily
Schedule::command('vtu:update-prices')->dailyAt('01:30');

// Check pending transactions status every minute
Schedule::command('vtu:check-transactions')->everyMinute();

// Process borrowing repayments (auto-deduction) every minute
Schedule::command('borrowing:process-repayments')->everyMinute();

// Borrowing Management (every day at 2:00 AM)
Schedule::command('borrowing:handle-overdue')->dailyAt('02:00');

// Send payment reminders (3 days before due date at 9:00 AM)
Schedule::command('borrowing:send-reminders', ['--days=3'])->dailyAt('09:00');

// Send urgent reminders (1 day before due date at 6:00 PM)
Schedule::command('borrowing:send-reminders', ['--days=1'])->dailyAt('18:00');
