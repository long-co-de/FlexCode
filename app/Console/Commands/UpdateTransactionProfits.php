<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transaction;
use App\Models\Setting;
use App\Models\Borrowing;
use Illuminate\Support\Facades\DB;

class UpdateTransactionProfits extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:update-transaction-profits';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Updates profit column for existing transactions based on historical settings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting profit calculation for existing transactions...');

        $settings = [
            'data' => Setting::where('key', 'data_profit_percentage')->value('value') ?? 5,
            'airtime' => Setting::where('key', 'airtime_profit_percentage')->value('value') ?? 2,
            'cable' => Setting::where('key', 'cable_profit_percentage')->value('value') ?? 3,
            'electricity' => Setting::where('key', 'electricity_profit_percentage')->value('value') ?? 2,
        ];

        $transactions = Transaction::where('status', 'successful')
            ->where('profit', 0)
            ->whereIn('type', ['data', 'airtime', 'cable', 'electricity', 'borrowing_repayment'])
            ->get();

        $bar = $this->output->createProgressBar(count($transactions));
        $bar->start();

        foreach ($transactions as $transaction) {
            $profit = 0;

            if ($transaction->type === 'borrowing_repayment') {
                $borrowingId = $transaction->meta_data['borrowing_id'] ?? null;
                if ($borrowingId) {
                    $borrowing = Borrowing::find($borrowingId);
                    if ($borrowing) {
                        $profit = $borrowing->total_amount - $borrowing->amount;
                    }
                }
            } else {
                $percentage = $settings[$transaction->type] ?? 0;
                $profit = ($transaction->amount * $percentage) / 100;
            }

            if ($profit > 0) {
                $transaction->profit = $profit;
                $transaction->save();

                // Also populate system_profits table for historical data
                \App\Models\SystemProfit::updateOrCreate(
                    ['transaction_id' => $transaction->id],
                    [
                        'user_id' => $transaction->user_id,
                        'profit_source' => $transaction->type === 'borrowing_repayment' ? 'borrowing_interest' : $transaction->type,
                        'amount' => $transaction->amount,
                        'profit_percentage' => $transaction->type === 'borrowing_repayment' 
                            ? (isset($borrowing) && $borrowing->amount > 0 ? ($profit / $borrowing->amount) * 100 : 0)
                            : ($settings[$transaction->type] ?? 0),
                        'profit_amount' => $profit,
                        'status' => 'recorded',
                        'description' => "Historical profit record for {$transaction->type} transaction: {$transaction->reference}",
                        'meta_data' => [
                            'reference' => $transaction->reference,
                            'is_historical' => true,
                            'updated_at' => now(),
                        ],
                        'created_at' => $transaction->created_at,
                    ]
                );
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Profit updates completed!');
    }
}
