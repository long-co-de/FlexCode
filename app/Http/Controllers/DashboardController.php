<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\User;
use App\Services\DatavendroService;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display the user dashboard.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get recent transactions
        $recentTransactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Get transaction statistics
        $transactionStats = [
            'total' => Transaction::where('user_id', $user->id)->count(),
            'successful' => Transaction::where('user_id', $user->id)->where('status', 'successful')->count(),
            'pending' => Transaction::where('user_id', $user->id)->where('status', 'pending')->count(),
            'failed' => Transaction::where('user_id', $user->id)->where('status', 'failed')->count(),
            'total_amount' => number_format(Transaction::where(['user_id'=>$user->id,'status'=>'successful'])->sum('amount')??0,0)
        ];


        // Get service usage statistics
        $serviceUsage = Transaction::where('user_id', $user->id)
            ->where('status', 'successful')
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type')
            ->toArray();

        return Inertia::render('Dashboard', [
            'recentTransactions' => $recentTransactions,
            'transactionStats' => $transactionStats,
            'serviceUsage' => $serviceUsage,
        ]);
    }

    /**
     * Display the admin dashboard.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function adminDashboard(Request $request)
    {
        // Get user statistics
        $userStats = [
            'total' => User::count(),
            'admin' => User::where('role', 'admin')->count(),
            'agent' => User::where('role', 'agent')->count(),
            'user' => User::where('role', 'user')->count(),
            'total_wallet_balance' => User::sum('wallet_balance'),
        ];

        // Get transaction statistics
        $transactionStats = [
            'total' => Transaction::count(),
            'successful' => Transaction::where('status', 'successful')->count(),
            'pending' => Transaction::where('status', 'pending')->count(),
            'failed' => Transaction::where('status', 'failed')->count(),
        ];

        // Get recent transactions
        $recentTransactions = Transaction::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get service usage statistics
        $serviceUsage = Transaction::where('status', 'successful')
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type')
            ->toArray();

        // Get daily transaction amounts for the last 7 days
        $dailyTransactions = Transaction::where('status', 'successful')
            ->where('created_at', '>=', now()->subDays(7))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Prepare chart data
        $chartData = [
            'transactionsChart' => $this->prepareTransactionsChart($dailyTransactions),
            'revenueChart' => $this->prepareRevenueChart($dailyTransactions),
            'userGrowthChart' => $this->prepareUserGrowthChart(),
            'transactionTypesChart' => $this->prepareTransactionTypesChart($serviceUsage),
        ];

        // Get API details
        $datavendroService = app(DatavendroService::class);
        $apiBalance = $datavendroService->getBalance();
        // $virtualAccounts = $datavendroService->getVirtualAccountDetails(); // Datavendro doesn't have this yet

        $apiDetails = [
            'balance' => $apiBalance['success'] ? $apiBalance['data'] : null,
            'balanceError' => !$apiBalance['success'] ? $apiBalance['message'] : null,
            'virtualAccounts' => [], // $virtualAccounts['success'] ? $virtualAccounts['data']['virtual_accounts'] : [],
            'virtualAccountError' => null,
            'lastChecked' => now()->format('Y-m-d H:i:s'),
        ];

        return Inertia::render('Admin/Dashboard', [
            'userStats' => $userStats,
            'transactionStats' => $transactionStats,
            'recentTransactions' => $recentTransactions,
            'serviceUsage' => $serviceUsage,
            'dailyTransactions' => $dailyTransactions,
            'chartData' => $chartData,
            'apiDetails' => $apiDetails,
            'stats' => [
                'totalUsers' => $userStats['total'],
                'totalTransactions' => $transactionStats['total'],
                'totalRevenue' => Transaction::where('status', 'successful')->sum('amount'),
                'totalWalletBalance' => $userStats['total_wallet_balance'],
                'successRate' => $transactionStats['total'] > 0
                    ? round(($transactionStats['successful'] / $transactionStats['total']) * 100)
                    : 0,
                'pendingTransactions' => $transactionStats['pending'],
                'apiBalance' => $apiBalance['success'] ? ($apiBalance['data']['balance'] ?? 0) : 0,
            ],
        ]);
    }

    /**
     * Prepare transactions chart data
     *
     * @param  \Illuminate\Support\Collection  $dailyTransactions
     * @return array
     */
    private function prepareTransactionsChart($dailyTransactions)
    {
        $labels = $dailyTransactions->pluck('date')->toArray();
        $counts = $dailyTransactions->pluck('count')->toArray();

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Transactions',
                    'data' => $counts,
                    'backgroundColor' => 'rgba(59, 130, 246, 0.5)',
                    'borderColor' => 'rgb(59, 130, 246)',
                    'borderWidth' => 1,
                ],
            ],
        ];
    }

    /**
     * Prepare revenue chart data
     *
     * @param  \Illuminate\Support\Collection  $dailyTransactions
     * @return array
     */
    private function prepareRevenueChart($dailyTransactions)
    {
        $labels = $dailyTransactions->pluck('date')->toArray();
        $amounts = $dailyTransactions->pluck('total_amount')->toArray();

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Revenue',
                    'data' => $amounts,
                    'fill' => false,
                    'borderColor' => 'rgb(34, 197, 94)',
                    'tension' => 0.1,
                ],
            ],
        ];
    }

    /**
     * Prepare user growth chart data
     *
     * @return array
     */
    private function prepareUserGrowthChart()
    {
        // Get user registrations for the last 7 days
        $userGrowth = User::where('created_at', '>=', now()->subDays(7))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $labels = $userGrowth->pluck('date')->toArray();
        $counts = $userGrowth->pluck('count')->toArray();

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'New Users',
                    'data' => $counts,
                    'fill' => false,
                    'borderColor' => 'rgb(249, 115, 22)',
                    'tension' => 0.1,
                ],
            ],
        ];
    }

    /**
     * Prepare transaction types chart data
     *
     * @param  array  $serviceUsage
     * @return array
     */
    private function prepareTransactionTypesChart($serviceUsage)
    {
        $labels = array_keys($serviceUsage);
        $data = array_values($serviceUsage);

        // Generate colors for each type
        $backgroundColors = [];
        $borderColors = [];

        foreach ($labels as $index => $label) {
            // Generate a color based on the index
            $hue = ($index * 137) % 360; // Golden angle approximation for good distribution
            $backgroundColors[] = "hsla({$hue}, 70%, 60%, 0.7)";
            $borderColors[] = "hsla({$hue}, 70%, 50%, 1)";
        }

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'data' => $data,
                    'backgroundColor' => $backgroundColors,
                    'borderColor' => $borderColors,
                    'borderWidth' => 1,
                ],
            ],
        ];
    }
}
