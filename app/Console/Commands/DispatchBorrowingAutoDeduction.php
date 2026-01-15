<?php

namespace App\Console\Commands;

use App\Models\Borrowing;
use App\Jobs\ProcessBorrowingAutoDeduction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DispatchBorrowingAutoDeduction extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'borrowing:dispatch-auto-deduction {--max-retries=3}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Dispatch auto-deduction jobs for due borrowings (queue-based worker)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔄 Dispatching auto-deduction jobs...');

        $maxRetries = (int) $this->option('max-retries');

        // Get all due borrowings that need auto-deduction
        $borrowings = Borrowing::where('status', 'active')
            ->where('due_date', '<=', now())
            ->where('retry_count', '<', $maxRetries)
            ->orderBy('due_date', 'asc')
            ->get();

        if ($borrowings->isEmpty()) {
            $this->info('✓ No pending borrowings found for auto-deduction.');
            return 0;
        }

        $this->info("📊 Found {$borrowings->count()} borrowing(s) due for auto-deduction");
        $this->newLine();

        $dispatched = 0;
        foreach ($borrowings as $borrowing) {
            try {
                // Dispatch job to queue
                ProcessBorrowingAutoDeduction::dispatch($borrowing);
                $dispatched++;

                $this->line("✓ Dispatched: {$borrowing->reference} (₦{$borrowing->total_amount})");
            } catch (\Exception $e) {
                $this->error("✗ Failed to dispatch {$borrowing->reference}: {$e->getMessage()}");
                Log::error('Failed to dispatch auto-deduction job', [
                    'borrowing_id' => $borrowing->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->newLine();
        $this->info("✅ Dispatched {$dispatched}/{$borrowings->count()} jobs to queue");

        Log::info('Auto-deduction jobs dispatched', [
            'total' => $borrowings->count(),
            'dispatched' => $dispatched,
        ]);

        return 0;
    }
}
