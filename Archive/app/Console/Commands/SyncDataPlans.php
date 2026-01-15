<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\HusmodataService;
use App\Models\Network;
use App\Models\DataPlan;
use Illuminate\Support\Facades\Log;

class SyncDataPlans extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vtu:sync-data-plans';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync data plans from Husmodata API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting data plans sync...');
        
        $husmodataService = app(HusmodataService::class);
        
        // Get networks from API
        $networksResponse = $husmodataService->getNetworks();
        
        if (!$networksResponse['success']) {
            $this->error('Failed to fetch networks: ' . ($networksResponse['message'] ?? 'Unknown error'));
            return 1;
        }
        
        $networks = $networksResponse['data'];
        $this->info('Found ' . count($networks) . ' networks');
        
        foreach ($networks as $networkData) {
            $this->info('Processing network: ' . $networkData['name']);
            
            // Create or update network
            $network = Network::updateOrCreate(
                ['code' => $networkData['code']],
                [
                    'name' => $networkData['name'],
                    'logo' => $networkData['logo'] ?? null,
                    'is_active' => true,
                ]
            );
            
            // Get data plans for this network
            $plansResponse = $husmodataService->getDataPlans($networkData['code']);
            
            if (!$plansResponse['success']) {
                $this->warn('Failed to fetch data plans for ' . $networkData['name'] . ': ' . ($plansResponse['message'] ?? 'Unknown error'));
                continue;
            }
            
            $plans = $plansResponse['data'];
            $this->info('Found ' . count($plans) . ' data plans for ' . $networkData['name']);
            
            // Debug the first plan to see what data we're getting
            if (count($plans) > 0) {
                $this->info('Sample plan data: ' . json_encode($plans[0]));
            }
            
            foreach ($plans as $planData) {
                // Calculate selling price based on profit percentage
                $sellingPrice = $husmodataService->calculateSellingPrice($planData['price'], 'data');
                
                // Create or update data plan 
                DataPlan::updateOrCreate(
                    [
                        'network_id' => $network->id,
                        'code' => $planData['code'],
                    ],
                    [
                        'name' => $planData['name'],
                        'price' => $planData['price'],
                        'selling_price' => $sellingPrice,
                        'validity' => $planData['validity'] ?? '30 days',
                        'data_amount' => $planData['data_amount'] ?? $planData['name'],
                        'is_active' => true,
                        'plan_type' => $planData['plan_type'] ?? null,
                        'dataplan_id' => $planData['id'] ?? $planData['code'] // Store the actual dataplan_id from the API
                    ]
                );
            }
            
            $this->info('Successfully synced data plans for ' . $networkData['name']);
        }
        
        $this->info('Data plans sync completed successfully!');
        return 0;
    }
}