<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class BorrowingController extends Controller
{
    /**
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
        try {
            // Logic to trigger repayment (e.g., charge the card or wallet)
            if ($borrowing->status !== 'active' && $borrowing->status !== 'overdue') {
                return back()->with('error', 'This borrowing cannot be repaid in its current status.');
            }

            // TODO: Implement actual repayment logic
            // For now, mark as paid if payment is successful
            $borrowing->markAsPaid();

            return back()->with('success', 'Repayment triggered successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to trigger repayment: ' . $e->getMessage());
        }
    }

    /**
     * Manually mark borrowing as paid.
     */
    public function markAsPaid(Borrowing $borrowing)
    {
        try {
            $borrowing->markAsPaid();
            return back()->with('success', 'Borrowing marked as paid.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to mark as paid: ' . $e->getMessage());
        }
    }

    /**
     * Cancel a borrowing.
     */
    public function cancel(Borrowing $borrowing)
    {
        try {
            if ($borrowing->status === 'paid') {
                return back()->with('error', 'Cannot cancel a paid borrowing.');
            }

            $borrowing->status = 'failed';
            $borrowing->save();

            return back()->with('success', 'Borrowing cancelled.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to cancel borrowing: ' . $e->getMessage());
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
