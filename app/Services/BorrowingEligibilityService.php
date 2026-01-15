<?php

namespace App\Services;

use App\Models\BorrowingEligibility;
use App\Models\User;

class BorrowingEligibilityService
{
    protected $creditScoringService;

    public function __construct(AdvancedCreditScoringService $creditScoringService)
    {
        $this->creditScoringService = $creditScoringService;
    }

    /**
     * Check and update user borrowing eligibility
     * Optionally pass service type to use specific credit settings
     */
    public function checkEligibility(User $user, ?string $serviceType = null)
    {
        // Calculate advanced credit score
        $creditScore = $this->creditScoringService->calculateCreditScore($user);

        // Determine eligibility using service-specific settings if provided
        $eligibilityInfo = $this->creditScoringService->determineEligibility($user, $creditScore, $serviceType);

        // Calculate appropriate credit limit using service-specific settings
        $creditLimit = $this->creditScoringService->calculateCreditLimit($user, $creditScore, $serviceType);

        // Get current available credit (limit - borrowed)
        $usedCredit = $user->activeBorrowings()->sum('amount');
        $availableCredit = max(0, $creditLimit - $usedCredit);

        // Update or create eligibility record
        $eligibility = BorrowingEligibility::updateOrCreate(
            ['user_id' => $user->id],
            [
                'eligibility_status' => $eligibilityInfo['status'],
                'credit_score' => $creditScore,
                'credit_limit' => $creditLimit,
                'available_credit' => $availableCredit,
                'eligibility_criteria' => $this->buildDetailedCriteria($user, $creditScore),
                'rejection_reason' => $eligibilityInfo['reason'],
                'last_eligibility_check' => now(),
            ]
        );

        return $eligibility;
    }

    /**
     * Build detailed criteria for reporting/debugging
     */
    private function buildDetailedCriteria(User $user, int $creditScore): array
    {
        $successfulTransactions = $user->transactions()
            ->where('status', 'success')
            ->count();

        $totalSpent = $user->transactions()
            ->where('status', 'success')
            ->sum('amount');

        $accountAgeDays = $user->created_at->diffInDays(now());
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();
        $completedBorrowings = $user->borrowings()->where('status', 'paid')->count();
        $activeBorrowings = $user->activeBorrowings()->count();

        return [
            'credit_score' => $creditScore,
            'account_age_days' => $accountAgeDays,
            'successful_transactions' => $successfulTransactions,
            'total_spent' => (float) $totalSpent,
            'average_transaction' => $successfulTransactions > 0 ? round($totalSpent / $successfulTransactions, 2) : 0,
            'has_active_card' => $hasActiveCard,
            'completed_borrowings' => $completedBorrowings,
            'active_borrowings' => $activeBorrowings,
            'wallet_balance' => (float) $user->wallet_balance,
            'calculated_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Force recalculation of eligibility (useful after card linking or transactions)
     */
    public function recalculate(User $user, ?string $serviceType = null): BorrowingEligibility
    {
        return $this->checkEligibility($user, $serviceType);
    }

    /**
     * Check if user is eligible without updating database
     */
    public function isEligible(User $user): bool
    {
        $eligibility = $user->borrowingEligibility;

        return $eligibility && $eligibility->isEligible();
    }

    /**
     * Get formatted eligibility information
     */
    public function getEligibilityInfo(User $user, ?string $serviceType = null): array
    {
        $eligibility = $user->borrowingEligibility ?? $this->checkEligibility($user, $serviceType);

        return [
            'is_eligible' => $eligibility->isEligible(),
            'status' => $eligibility->eligibility_status,
            'credit_score' => $eligibility->credit_score,
            'credit_limit' => (float) $eligibility->credit_limit,
            'available_credit' => (float) $eligibility->available_credit,
            'used_credit' => (float) ($eligibility->credit_limit - $eligibility->available_credit),
            'rejection_reason' => $eligibility->rejection_reason,
        ];
    }
}
