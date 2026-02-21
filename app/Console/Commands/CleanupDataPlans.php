<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DataPlan;
use Illuminate\Support\Facades\Log;

class CleanupDataPlans extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vtu:cleanup-data-plans';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove non-working data plans (Corporate Gifting, SME, SMS, and high prices)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Cleaning up non-working data plans...');
        Log::info('=== Starting Data Plans Cleanup ===');

        $count = 0;

        // Find plans with 'CORPORATE GIFTING', 'SME', 'SMS' or abnormal prices
        $plansToDelete = DataPlan::where(function($query) {
            $query->where('name', 'LIKE', '%CORPORATE GIFTING%')
                  ->orWhere('plan_type', 'LIKE', '%CORPORATE GIFTING%')
                  ->orWhere('name', 'LIKE', '%SME%')
                  ->orWhere('plan_type', 'LIKE', '%SME%')
                  ->orWhere('name', 'LIKE', '%SMS%')
                  ->orWhere('plan_type', 'LIKE', '%SMS%')
                  ->orWhere('price', '>', 50000);
        })->get();

        foreach ($plansToDelete as $plan) {
            $this->info("Deleting plan: {$plan->name} (ID: {$plan->id}, Type: {$plan->plan_type})");
            Log::info("Deleting non-working plan", [
                'id' => $plan->id,
                'name' => $plan->name,
                'plan_type' => $plan->plan_type
            ]);
            $plan->delete();
            $count++;
        }

        $this->info("✓ Cleanup completed! Total plans deleted: {$count}");
        Log::info("✓ Data plans cleanup successful!", ['deleted_count' => $count]);

        return 0;
    }
}
