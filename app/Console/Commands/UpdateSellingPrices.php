<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DatavendroService;
use App\Models\DataPlan;
use App\Models\CablePlan;
use App\Models\AirtimeDiscount;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class UpdateSellingPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vtu:update-prices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update selling prices based on profit percentages';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting price update...');

        $datavendroService = app(DatavendroService::class);

        // Update data plans selling prices
        $this->info('Updating data plans selling prices...');
        $dataPlans = DataPlan::all();
        $dataProfit = Setting::get('data_profit_percentage', 5);

        foreach ($dataPlans as $plan) {
            $sellingPrice = $datavendroService->calculateSellingPrice($plan->price, 'data');
            $plan->selling_price = $sellingPrice;
            $plan->save();
        }

        $this->info('Updated ' . $dataPlans->count() . ' data plans with ' . $dataProfit . '% profit margin');

        // Update cable plans selling prices
        $this->info('Updating cable plans selling prices...');
        $cablePlans = CablePlan::all();
        $cableProfit = Setting::get('cable_profit_percentage', 3);

        foreach ($cablePlans as $plan) {
            $sellingPrice = $datavendroService->calculateSellingPrice($plan->price, 'cable');
            $plan->selling_price = $sellingPrice;
            $plan->save();
        }

        $this->info('Updated ' . $cablePlans->count() . ' cable plans with ' . $cableProfit . '% profit margin');

        // Update airtime discounts
        $this->info('Updating airtime discounts...');
        $airtimeDiscounts = AirtimeDiscount::all();
        $airtimeProfit = Setting::get('airtime_profit_percentage', 2);

        foreach ($airtimeDiscounts as $discount) {
            // For airtime, we typically set a discount percentage rather than a selling price
            // The discount is usually the API provider's discount minus our profit margin
            $discount->discount_percentage = max(0, $discount->original_discount_percentage - $airtimeProfit);
            $discount->save();
        }

        $this->info('Updated ' . $airtimeDiscounts->count() . ' airtime discounts with ' . $airtimeProfit . '% profit margin');

        $this->info('Price update completed successfully!');
        return 0;
    }
}
