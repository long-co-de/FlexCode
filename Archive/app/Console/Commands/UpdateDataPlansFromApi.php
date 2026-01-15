<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\HusmodataService;
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
    protected $description = 'Update data plans from HusmoDataAPI and store in database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting data plans update from API...');
        
        $husmodataService = app(HusmodataService::class);
        
        // Get all data plans from API and store in database
        $response = $husmodataService->getAllDataPlans(true);
        
        if ($response['success']) {
            $this->info('Data plans updated successfully!');
            return 0;
        } else {
            $this->error('Failed to update data plans: ' . ($response['message'] ?? 'Unknown error'));
            return 1;
        }
    }
}