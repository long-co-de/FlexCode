<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AtomicController;
use App\Models\Borrowing;
use App\Models\User;
use App\Services\BorrowingService;use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class BorrowingController extends AtomicController
{
    protected $borrowingService;

    public function __construct(BorrowingService $borrowingService)
    {
        $this->borrowingService = $borrowingService;
    }    /**
     * Display a listing of all borrowings.
     */
    public function index(Request $request)
    {
        $query = Borrowing::with('user');

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Search by user name or email or borrowing reference
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('reference', 'like', "%{$request->search}%")
                    ->orWhereHas('user', function ($userQuery) use ($request) {
                        $userQuery->where('name', 'like', "%{$request->search}%")
                            ->orWhere('email', 'like', "%{$request->search}%");
                    });
            });
        }

        $borrowings = $query->orderBy('created_at', 'desc')->paginate(20);

        // Get summary statistics
        $stats = [
            'total' => Borrowing::count(),
            'active' => Borrowing::where('status', 'active')->count(),
            'overdue' => Borrowing::where('status', 'overdue')->count(),
            'paid' => Borrowing::where('status', 'paid')->count(),
            'total_amount' => Borrowing::sum('amount'),
            'total_due' => Borrowing::sum('total_amount'),
            'total_repaid' => Borrowing::where('status', 'paid')->sum('total_amount'),
        ];

        return Inertia::render('Admin/Borrowings/Index', [
            'borrowings' => $borrowings,
            'stats' => $stats,
            'filters' => [
                'status' => $request->status,
                'type' => $request->type,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Display a specific borrowing.
     */
    public function show(Borrowing $borrowing)
    {
        $borrowing->load('user', 'repayments');

        return Inertia::render('Admin/Borrowings/Show', [
            'borrowing' => $borrowing,
        ]);
    }

    /**
     * Trigger repayment for a borrowing.
     */
    public function triggerRepayment(Borrowing $borrowing)
    {
        $lockKey = 'admin_borrowing_lock_' . $borrowing->id;
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 10);

        if (!$lock->get()) {
            return back()->with('error', 'This record is currently being updated.');
        }

        try {
            $this->borrowingService->processRepayment($borrowing);

            \Illuminate\Support\Facades\Cache::forget($lockKey);
            return back()->with('success', 'Repayment triggered successfully.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Cache::forget($lockKey);            return back()->with('error', 'Failed to trigger repayment: ' . $e->getMessage());
        }
    }

    /**
     * Manually mark borrowing as paid.
     */
    public function markAsPaid(Borrowing $borrowing)
    {
        $lockKey = 'admin_borrowing_lock_' . $borrowing->id;
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 10);

        if (!$lock->get()) {
            return back()->with('error', 'This record is currently being updated.');
        }

        try {
            $this->borrowingService->payDebt($borrowing, $borrowing->total_amount, 'manual_admin');
            
            \Illuminate\Support\Facades\Cache::forget($lockKey);
            return back()->with('success', 'Borrowing marked as paid.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Cache::forget($lockKey);            return back()->with('error', 'Failed to mark as paid: ' . $e->getMessage());
        }
    }

    /**
     * Process payment from user's card.
     */
    public function processPayment(Borrowing $borrowing)
    {
        $lockKey = 'admin_borrowing_lock_' . $borrowing->id;
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 10);

        if (!$lock->get()) {
            return back()->with('error', 'This record is currently being updated.');
        }

        try {
            // Attempt to charge the user's card for the outstanding amount
            $this->borrowingService->payDebt($borrowing, $borrowing->total_amount, 'card_charge');

            \Illuminate\Support\Facades\Cache::forget($lockKey);
            return back()->with('success', 'Payment processed successfully from user card.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Cache::forget($lockKey);
            return back()->with('error', 'Failed to process payment: ' . $e->getMessage());
        }
    }

    /**            return back()->with('error', 'Failed to cancel borrowing: ' . $e->getMessage());
        }
    }

    /**
     * Get borrowing statistics for charts.
     */
    public function getStatistics()
    {
        // Status breakdown
        $statusBreakdown = Borrowing::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Type breakdown
        $typeBreakdown = Borrowing::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        // Daily borrowings for the last 7 days
        $dailyBorrowings = Borrowing::where('created_at', '>=', now()->subDays(7))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'statusBreakdown' => $statusBreakdown,
            'typeBreakdown' => $typeBreakdown,
            'dailyBorrowings' => $dailyBorrowings,
        ];
    }
}
