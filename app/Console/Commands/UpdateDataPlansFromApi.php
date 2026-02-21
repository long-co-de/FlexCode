<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DatavendroService;
use Illuminate\Support\Facades\Log;

class UpdateDataPlansFromApi extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vtu:update-data-plans';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update data plans from Datavendro API and store in database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting data plans update from Datavendro API...');
        Log::info('=== Starting Data Plans Update ===');

        try {
            $datavendroService = app(DatavendroService::class);

            $this->info('[DEBUG] Initialized DatavendroService');
            Log::info('[DEBUG] Initialized DatavendroService');

            // Get all data plans from API and store in database
            $this->info('[DEBUG] Fetching data plans from API...');
            Log::info('[DEBUG] Fetching data plans from API...');

            $response = $datavendroService->getAllDataPlans(true);

            $this->info('[DEBUG] API Response received');
            Log::info('[DEBUG] API Response', [
                'success' => $response['success'] ?? false,
                'message' => $response['message'] ?? null,
                'has_data' => isset($response['data']),
                'data_count' => isset($response['data']) ? count($response['data']) : 0
            ]);

            if ($response['success']) {
                $this->info('✓ Data plans updated successfully!');
                $this->info('Total networks processed: ' . (isset($response['data']) ? count($response['data']) : 0));
                Log::info('✓ Data plans updated successfully!', [
                    'networks_count' => isset($response['data']) ? count($response['data']) : 0
                ]);
                return 0;
            } else {
                $errorMsg = $response['message'] ?? 'Unknown error';
                $this->error('✗ Failed to update data plans: ' . $errorMsg);
                Log::error('✗ Failed to update data plans', [
                    'error' => $errorMsg,
                    'response' => $response
                ]);
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('✗ Exception occurred: ' . $e->getMessage());
            Log::error('Exception in UpdateDataPlansFromApi', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}
