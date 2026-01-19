<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the agent dashboard.
     */
    public function index()
    {
        $agent = Auth::user();

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

        // Get borrowing statistics
        $borrowingStats = [
            'total_borrowings' => Borrowing::count(),
            'active_borrowings' => Borrowing::where('status', 'active')->count(),
            'overdue_borrowings' => Borrowing::where('status', 'overdue')->count(),
            'paid_borrowings' => Borrowing::where('status', 'paid')->count(),
            'total_borrowed_amount' => Borrowing::sum('amount'),
            'total_interest_generated' => Borrowing::sum(DB::raw('total_amount - amount')),
            'total_repaid_amount' => Borrowing::where('status', 'paid')->sum('total_amount'),
        ];

        // Get recent borrowings (for display)
        $recentBorrowings = Borrowing::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

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
        $dailyProfit = Transaction::where('status', 'successful')
            ->whereIn('type', ['data', 'airtime', 'cable', 'electricity', 'borrowing_repayment'])
            ->where('created_at', '>=', now()->subDays(7))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(profit) as total_profit'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Prepare chart data
        $chartData = [
            'transactionsChart' => $this->prepareTransactionsChart($dailyTransactions),
            'revenueChart' => $this->prepareRevenueChart($dailyProfit),
            'userGrowthChart' => $this->prepareUserGrowthChart(),
            'transactionTypesChart' => $this->prepareTransactionTypesChart($serviceUsage),
        ];

        // Get recent messages
        $recentMessages = Message::with(['conversation', 'user:id,name,email'])
            ->whereHas('conversation', function ($query) {
                $query->where('status', 'open');
            })
            ->where('is_from_user', true)
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'user' => $message->user,
                    'message' => $message->message,
                    'created_at' => $message->created_at->diffForHumans(),
                    'is_read' => $message->is_read,
                ];
            });

        return Inertia::render('Agent/Dashboard', [
            'auth' => [
                'user' => $agent,
            ],
            'userStats' => $userStats,
            'transactionStats' => $transactionStats,
            'recentTransactions' => $recentTransactions,
            'borrowingStats' => $borrowingStats,
            'recentBorrowings' => $recentBorrowings,
            'serviceUsage' => $serviceUsage,
            'dailyTransactions' => $dailyTransactions,
            'chartData' => $chartData,
            'recentMessages' => $recentMessages,
            'stats' => [
                'totalUsers' => $userStats['total'],
                'totalTransactions' => $transactionStats['total'],
                'totalRevenue' => Transaction::where('status', 'successful')
                    ->whereIn('type', ['data', 'airtime', 'cable', 'electricity', 'borrowing_repayment'])
                    ->sum('profit'),
                'totalWalletBalance' => $userStats['total_wallet_balance'],
                'successRate' => $transactionStats['total'] > 0
                    ? round(($transactionStats['successful'] / $transactionStats['total']) * 100)
                    : 0,
                'pendingTransactions' => $transactionStats['pending'],
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
                    'borderColor' => 'rgba(59, 130, 246, 1)',
                    'borderWidth' => 1,
                    'fill' => true,
                ],
            ],
        ];
    }

    /**
     * Prepare revenue chart data
     *
     * @param  \Illuminate\Support\Collection  $dailyProfit
     * @return array
     */
    private function prepareRevenueChart($dailyProfit)
    {
        $labels = $dailyProfit->pluck('date')->toArray();
        $amounts = $dailyProfit->pluck('total_profit')->toArray();

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Revenue',
                    'data' => $amounts,
                    'borderColor' => 'rgba(34, 197, 94, 1)',
                    'backgroundColor' => 'rgba(34, 197, 94, 0.1)',
                    'borderWidth' => 2,
                    'fill' => true,
                    'tension' => 0.4,
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
                    'borderColor' => 'rgba(168, 85, 247, 1)',
                    'backgroundColor' => 'rgba(168, 85, 247, 0.1)',
                    'borderWidth' => 2,
                    'fill' => true,
                    'tension' => 0.4,
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

        $colors = [
            'rgba(59, 130, 246, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(251, 146, 60, 0.7)',
            'rgba(168, 85, 247, 0.7)',
        ];

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'data' => $data,
                    'backgroundColor' => array_slice($colors, 0, count($labels)),
                    'borderColor' => [
                        'rgba(59, 130, 246, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(168, 85, 247, 1)',
                    ],
                    'borderWidth' => 1,
                ],
            ],
        ];
    }
}
