<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DatavendroService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProviderSyncController extends Controller
{
    private $datavendroService;

    public function __construct(DatavendroService $datavendroService)
    {
        $this->datavendroService = $datavendroService;
    }

    public function index()
    {
        return Inertia::render('Admin/ProviderSync/Index', [
            'lastSync' => $this->getLastSyncTime(),
            'statistics' => $this->getSyncStatistics(),
        ]);
    }

    public function sync(Request $request)
    {
        try {
            Log::info('Manual Datavendro sync initiated by admin', [
                'user_id' => auth()->id(),
                'ip' => $request->ip(),
            ]);

            $response = $this->datavendroService->getAllDataPlans(true);

            if ($response['success']) {
                Log::info('Manual Datavendro sync completed successfully', [
                    'user_id' => auth()->id(),
                ]);
                return redirect()->back()->with('success', 'Datavendro data plans synced successfully!');
            }

            return redirect()->back()->with('error', 'Sync failed: ' . ($response['message'] ?? 'Unknown error'));
        } catch (\Exception $e) {
            Log::error('Manual Husmodata sync failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Sync failed: ' . $e->getMessage());
        }
    }

    public function testConnection()
    {
        try {
            $balance = $this->datavendroService->getBalance();

            if ($balance['success']) {
                Log::info('Datavendro API connection test successful', [
                    'user_id' => auth()->id(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Connected to Datavendro API successfully!',
                    'data' => $balance['data'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $balance['message'] ?? 'Connection failed',
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Datavendro API connection test failed', [
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
        // For simplicity, we can just return the last updated_at of a DataPlan
        $lastPlan = \App\Models\DataPlan::orderBy('updated_at', 'desc')->first();
        return $lastPlan ? $lastPlan->updated_at->format('Y-m-d H:i:s') : null;
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
