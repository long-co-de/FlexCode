<?php
// File: BorrowingController.php
namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\Borrowing;
use App\Models\BorrowingEligibility;
use App\Services\BorrowingService;
use App\Services\BorrowingEligibilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BorrowingController extends AtomicController
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
     * Mobile/API-compatible borrowing list endpoint.
     */
    public function myBorrowingsApi(Request $request)
    {
        $borrowings = $request->user()->borrowings()
            ->with(['repayments' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }])
            ->orderBy('due_date', 'asc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'borrowings' => $borrowings,
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
        $request->validate([
            'request_id' => 'nullable|string',
        ]);

        $user = Auth::user();

        if ($borrowing->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Deduplication check
        if ($request->request_id && $this->isDuplicateRequest($request->request_id, $user->id, 'borrowing_repay')) {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been processed.'
            ], 400);
        }

        try {
            // Use atomic transaction to lock user and prevent race conditions
            // Even if it charges a card, we want to ensure no other transaction 
            // is modifying this user's debt/wallet state simultaneously.
            $result = $this->processAtomicTransaction($user->id, 0, function ($lockedUser) use ($borrowing) {
                // Re-verify status within transaction
                $borrowing = Borrowing::where('id', $borrowing->id)
                    ->where('status', '!=', 'paid')
                    ->lockForUpdate()
                    ->first();

                if (!$borrowing) {
                    throw new \Exception('This borrowing is already paid or not found.');
                }

                return $this->borrowingService->processRepayment($borrowing);
            });

            return response()->json([
                'success' => true,
                'message' => 'Repayment successful',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Repay all borrowings - attempts card charge first, falls back to wallet
     */
    public function repayAll(Request $request)
    {
        $request->validate([
            'request_id' => 'nullable|string',
        ]);

        $user = Auth::user();

        // Rate limiting
        if ($this->isRateLimited($user->id, 'repay_all', 3, 60)) {
            return back()->with('error', 'Too many repayment attempts. Please try again in a minute.');
        }

        // Deduplication check
        if ($request->request_id && $this->isDuplicateRequest($request->request_id, $user->id, 'borrowing_repay_all')) {
            return back()->with('error', 'This request has already been processed.');
        }

        try {
            // RepayAllFromCard handles its own transaction and wallet fallback
            // But we lock the user here to prevent concurrent repayAll attempts
            $totalSettled = $this->processAtomicTransaction($user->id, 0, function ($lockedUser) {
                return $this->borrowingService->repayAllFromCard($lockedUser);
            });
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
