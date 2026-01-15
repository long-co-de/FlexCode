<?php

namespace App\Console\Commands;

use App\Models\Network;
use App\Models\DataPlan;
use App\Models\CableProvider;
use App\Models\CablePlan;
use App\Models\ElectricityProvider;
use App\Services\WazobiaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class WazobiaSyncCommand extends Command
{
    protected $signature = 'wazobia:sync {--force : Force sync even if recent sync exists}';

    protected $description = 'Sync data from Wazobia API (networks, data plans, cable providers, electricity providers)';

    private $wazobiaService;

    public function __construct(WazobiaService $wazobiaService)
    {
        parent::__construct();
        $this->wazobiaService = $wazobiaService;
    }

    public function handle()
    {
        $this->info('Starting Wazobia data synchronization...');
        Log::info('WazobiaSyncCommand started');

        try {
            $this->syncNetworks();
            $this->syncDataPlans();
            $this->syncCableProviders();
            $this->syncElectricityProviders();

            $this->info('✓ Wazobia data synchronization completed successfully!');
            Log::info('WazobiaSyncCommand completed successfully');

            return 0;
        } catch (\Exception $e) {
            $this->error('✗ Sync failed: ' . $e->getMessage());
            Log::error('WazobiaSyncCommand failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return 1;
        }
    }

    private function syncNetworks()
    {
        $this->info('Syncing networks...');

        try {
            $networks = $this->wazobiaService->getNetworks();

            foreach ($networks as $networkData) {
                Network::updateOrCreate(
                    ['code' => $networkData['code']],
                    [
                        'name' => $networkData['name'],
                        'status' => true,
                    ]
                );
            }

            $this->info("✓ Synced " . count($networks) . " networks");
            Log::info('Networks synced', ['count' => count($networks)]);
        } catch (\Exception $e) {
            $this->error('✗ Failed to sync networks: ' . $e->getMessage());
            Log::error('Failed to sync networks', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function syncDataPlans()
    {
        $this->info('Syncing data plans...');

        try {
            $networks = Network::all();
            $totalPlans = 0;

            foreach ($networks as $network) {
                $networkId = $this->wazobiaService->getNetworkIdByCode($network->code);

                if (!$networkId) {
                    $this->warn("⚠ Could not find Wazobia network ID for: {$network->code}");
                    continue;
                }

                $plans = $this->wazobiaService->getDataPlans($networkId);

                foreach ($plans as $planData) {
                    DataPlan::updateOrCreate(
                        [
                            'network_id' => $network->id,
                            'dataplan_id' => $planData['plan_id'],
                        ],
                        [
                            'name' => "{$planData['size']} - {$planData['type']}",
                            'code' => (string)$planData['plan_id'],
                            'plan_type' => $planData['type'],
                            'price' => 0,
                            'validity' => $planData['validity'],
                            'data_amount' => $planData['size'],
                            'is_active' => true,
                            'last_api_update' => now(),
                        ]
                    );
                    $totalPlans++;
                }

                $this->info("  • {$network->name}: " . count($plans) . " plans");
            }

            $this->info("✓ Synced " . $totalPlans . " data plans");
            Log::info('Data plans synced', ['count' => $totalPlans]);
        } catch (\Exception $e) {
            $this->error('✗ Failed to sync data plans: ' . $e->getMessage());
            Log::error('Failed to sync data plans', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function syncCableProviders()
    {
        $this->info('Syncing cable providers and plans...');

        try {
            $providers = $this->wazobiaService->getCableProviders();
            $totalPlans = 0;

            foreach ($providers as $providerData) {
                $provider = CableProvider::updateOrCreate(
                    ['code' => $providerData['code']],
                    [
                        'name' => $providerData['name'],
                        'status' => true,
                    ]
                );

                $plans = $this->wazobiaService->getCablePlans($providerData['code']);

                foreach ($plans as $planData) {
                    CablePlan::updateOrCreate(
                        [
                            'cable_provider_id' => $provider->id,
                            'code' => $planData['code'],
                        ],
                        [
                            'name' => $planData['name'],
                            'product_code' => $planData['product_code'],
                            'amount' => $planData['price'],
                            'wazobia_price' => $planData['price'],
                            'status' => true,
                        ]
                    );
                    $totalPlans++;
                }

                $this->info("  • {$provider->name}: " . count($plans) . " plans");
            }

            $this->info("✓ Synced " . count($providers) . " cable providers with " . $totalPlans . " plans");
            Log::info('Cable providers synced', [
                'providers' => count($providers),
                'plans' => $totalPlans,
            ]);
        } catch (\Exception $e) {
            $this->error('✗ Failed to sync cable providers: ' . $e->getMessage());
            Log::error('Failed to sync cable providers', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function syncElectricityProviders()
    {
        $this->info('Syncing electricity providers...');

        try {
            $providers = $this->wazobiaService->getElectricityProviders();

            foreach ($providers as $providerData) {
                ElectricityProvider::updateOrCreate(
                    ['code' => $providerData['code']],
                    [
                        'name' => $providerData['name'],
                        'wazobia_code' => $providerData['code'],
                        'status' => true,
                    ]
                );
            }

            $this->info("✓ Synced " . count($providers) . " electricity providers");
            Log::info('Electricity providers synced', ['count' => count($providers)]);
        } catch (\Exception $e) {
            $this->error('✗ Failed to sync electricity providers: ' . $e->getMessage());
            Log::error('Failed to sync electricity providers', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
