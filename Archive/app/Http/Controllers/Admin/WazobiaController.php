<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\WazobiaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WazobiaController extends Controller
{
    private $wazobiaService;

    public function __construct(WazobiaService $wazobiaService)
    {
        $this->wazobiaService = $wazobiaService;
    }

    public function index()
    {
        return Inertia::render('Admin/Wazobia/Index', [
            'lastSync' => $this->getLastSyncTime(),
            'statistics' => $this->getSyncStatistics(),
        ]);
    }

    public function sync(Request $request)
    {
        try {
            Log::info('Manual Wazobia sync initiated by admin', [
                'user_id' => auth()->id(),
                'ip' => $request->ip(),
            ]);

            Artisan::call('wazobia:sync');

            Log::info('Manual Wazobia sync completed successfully', [
                'user_id' => auth()->id(),
            ]);

            return redirect()->back()->with('success', 'Wazobia data synced successfully! Check logs for details.');
        } catch (\Exception $e) {
            Log::error('Manual Wazobia sync failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Sync failed: ' . $e->getMessage());
        }
    }

    public function testConnection()
    {
        try {
            $balance = $this->wazobiaService->getBalance();

            if ($balance['success']) {
                Log::info('Wazobia API connection test successful', [
                    'user_id' => auth()->id(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Connected to Wazobia API successfully!',
                    'data' => $balance['data'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $balance['error'] ?? 'Connection failed',
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Wazobia API connection test failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function getLastSyncTime()
    {
        $logFile = storage_path('logs/laravel.log');

        if (!file_exists($logFile)) {
            return null;
        }

        $lines = array_reverse(file($logFile));

        foreach ($lines as $line) {
            if (strpos($line, 'WazobiaSyncCommand completed successfully') !== false) {
                preg_match('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $line, $matches);

                if (isset($matches[1])) {
                    return $matches[1];
                }
            }
        }

        return null;
    }

    private function getSyncStatistics()
    {
        try {
            return [
                'networks' => \App\Models\Network::count(),
                'data_plans' => \App\Models\DataPlan::count(),
                'cable_providers' => \App\Models\CableProvider::count(),
                'cable_plans' => \App\Models\CablePlan::count(),
                'electricity_providers' => \App\Models\ElectricityProvider::count(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get sync statistics', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
