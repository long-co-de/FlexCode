<?php
// File: BorrowingController.php
namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\BorrowingEligibility;
use App\Services\BorrowingService;
use App\Services\BorrowingEligibilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BorrowingController extends Controller
{
    protected $borrowingService;
    protected $eligibilityService;

    public function __construct(
        BorrowingService $borrowingService,
        BorrowingEligibilityService $eligibilityService
    ) {
        $this->borrowingService = $borrowingService;
        $this->eligibilityService = $eligibilityService;
    }

    /**
     * Display borrowing dashboard/selection.
     */
    public function index()
    {
        $user = Auth::user();
        
        return Inertia::render('User/Borrow/Index', [
            'eligibility' => $user->borrowingEligibility,
            'summary' => [
                'total_borrowed' => $user->borrowings()->sum('amount'),
                'total_repaid' => $user->borrowings()->where('status', 'paid')->sum('amount'),
                'active_borrowings' => $user->activeBorrowings()->count(),
                'overdue_borrowings' => $user->overdueBorrowings()->count(),
                'total_due' => $user->activeBorrowings()->sum('total_amount'),
            ],
            'has_card' => $user->cards()->exists(),
        ]);
    }

    /**
     * Check borrowing eligibility.
     */
    public function checkEligibility()
    {
        $user = Auth::user();
        $eligibility = $this->eligibilityService->checkEligibility($user);

        return response()->json([
            'is_eligible' => $eligibility->isEligible(),
            'credit_limit' => $eligibility->credit_limit,
            'available_credit' => $eligibility->available_credit,
            'credit_score' => $eligibility->credit_score,
            'has_card' => $user->cards()->exists(),
            'max_borrowable' => $eligibility->available_credit,
        ]);
    }

    /**
     * Display user's borrowings.
     */
    public function myBorrowings()
    {
        $user = Auth::user();

        $borrowings = $user->borrowings()
            ->with(['repayments' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }])
            ->orderBy('due_date', 'asc')
            ->paginate(20);

        return Inertia::render('User/Borrow/MyBorrowings', [
            'borrowings' => $borrowings,
            'eligibility' => $user->borrowingEligibility,
        ]);
    }

    /**
     * Display a specific borrowing.
     */
    public function show(Borrowing $borrowing)
    {
        $user = Auth::user();

        if ($borrowing->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $borrowing->load(['repayments' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        return Inertia::render('User/Borrow/BorrowingDetails', [
            'borrowing' => $borrowing,
        ]);
    }

    /**
     * Repay a borrowing.
     */
    public function repay(Request $request, Borrowing $borrowing)
    {
        $user = Auth::user();

        if ($borrowing->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($borrowing->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This borrowing is already paid'
            ], 400);
        }

        try {
            $repayment = $this->borrowingService->processRepayment($borrowing);

            return response()->json([
                'success' => true,
                'message' => 'Repayment successful',
                'data' => $repayment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Repay all borrowings from wallet.
     */
    public function repayAll(Request $request)
    {
        $user = Auth::user();

        try {
            $totalSettled = $this->borrowingService->repayFromWallet($user);

            return back()->with('success', "Successfully settled debt totaling ₦" . number_format($totalSettled, 2));
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Get borrowing summary.
     */
    public function summary()
    {
        $user = Auth::user();

        $summary = [
            'total_borrowed' => $user->borrowings()->sum('amount'),
            'total_repaid' => $user->borrowings()->where('status', 'paid')->sum('amount'),
            'active_borrowings' => $user->activeBorrowings()->count(),
            'overdue_borrowings' => $user->overdueBorrowings()->count(),
            'next_due_date' => $user->activeBorrowings()->min('due_date'),
            'total_due' => $user->activeBorrowings()->sum('total_amount'),
        ];

        return response()->json($summary);
    }
}
