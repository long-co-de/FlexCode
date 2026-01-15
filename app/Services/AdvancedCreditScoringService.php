<?php

namespace App\Services;

use App\Models\Borrowing;
use App\Models\CreditEligibilitySetting;
use App\Models\Transaction;
use App\Models\User;

class AdvancedCreditScoringService
{
    /**
     * Calculate comprehensive credit score using multiple factors
     * Score ranges from 0-100
     */
    public function calculateCreditScore(User $user): int
    {
        $score = 0;

        $score += $this->scoreAccountAge($user) * 0.10;           // 10% (reduced from 15%)
        $score += $this->scoreTransactionHistory($user) * 0.30;   // 30% (increased from 25%)
        $score += $this->scoreTransactionFrequency($user) * 0.15; // 15%
        $score += $this->scoreSpendingBehavior($user) * 0.15;     // 15%
        $score += $this->scorePaymentReliability($user) * 0.25;   // 25% (increased from 20%)
        $score += $this->scoreCardLinking($user) * 0.05;          // 5% (reduced from 10%)

        return min(round($score), 100);
    }

    /**
     * Score account age (0-100)
     * Rewards older, more established accounts
     */
    private function scoreAccountAge(User $user): int
    {
        $accountAgeDays = $user->created_at->diffInDays(now());

        if ($accountAgeDays >= 730) {
            return 100;
        }        // 2+ years = excellent
        if ($accountAgeDays >= 365) {
            return 85;
        }         // 1+ year = very good
        if ($accountAgeDays >= 180) {
            return 70;
        }         // 6+ months = good
        if ($accountAgeDays >= 90) {
            return 50;
        }          // 3+ months = fair
        if ($accountAgeDays >= 30) {
            return 30;
        }          // 1+ month = poor

        return 10;                                     // Less than 1 month = very poor
    }

    /**
     * Score transaction history (0-100)
     * Considers volume and success rate of transactions
     */
    private function scoreTransactionHistory(User $user): int
    {
        $transactions = Transaction::where('user_id', $user->id)->get();

        $totalTransactions = $transactions->count();
        $successfulTransactions = $transactions->where('status', 'success')->count();
        $failedTransactions = $transactions->where('status', 'failed')->count();

        if ($totalTransactions === 0) {
            return 0;
        }

        $successRate = ($successfulTransactions / $totalTransactions) * 100;

        // Penalize failed transactions heavily
        $failurePenalty = min($failedTransactions * 5, 30);

        // Score based on volume and success rate
        $volumeScore = 0;
        if ($totalTransactions >= 100) {
            $volumeScore = 40;
        } elseif ($totalTransactions >= 50) {
            $volumeScore = 35;
        } elseif ($totalTransactions >= 30) {
            $volumeScore = 30;
        } elseif ($totalTransactions >= 20) {
            $volumeScore = 25;
        } elseif ($totalTransactions >= 10) {
            $volumeScore = 15;
        } elseif ($totalTransactions >= 5) {
            $volumeScore = 10;
        } elseif ($totalTransactions >= 1) {
            $volumeScore = 5;
        }

        $baseScore = $volumeScore + ($successRate * 0.6);

        return max(0, (int) ($baseScore - $failurePenalty));
    }

    /**
     * Score transaction frequency (0-100)
     * Rewards consistent, regular transaction patterns
     */
    private function scoreTransactionFrequency(User $user): int
    {
        $transactions = Transaction::where('user_id', $user->id)
            ->where('status', 'success')
            ->orderBy('created_at', 'desc')
            ->take(30)
            ->get();

        if ($transactions->count() === 0) {
            return 0;
        }

        $lastThirtyDays = now()->subDays(30);
        $recentTransactions = $transactions->where('created_at', '>=', $lastThirtyDays)->count();

        // Check for consistent patterns
        $weeklyAverage = $recentTransactions / 4;

        if ($weeklyAverage >= 3) {
            return 100;
        }           // 3+ per week = excellent
        if ($weeklyAverage >= 2) {
            return 80;
        }            // 2+ per week = very good
        if ($weeklyAverage >= 1) {
            return 60;
        }            // 1+ per week = good
        if ($recentTransactions >= 2) {
            return 40;
        }       // 2+ per month = fair
        if ($recentTransactions >= 1) {
            return 20;
        }       // 1+ per month = poor

        return 0;
    }

    /**
     * Score spending behavior (0-100)
     * Rewards consistent, healthy spending patterns
     */
    private function scoreSpendingBehavior(User $user): int
    {
        $successfulTransactions = Transaction::where('user_id', $user->id)
            ->where('status', 'success')
            ->get();

        if ($successfulTransactions->count() === 0) {
            return 0;
        }

        $totalSpent = $successfulTransactions->sum('amount');
        $avgTransaction = $successfulTransactions->avg('amount');

        // Score based on total spending
        $spendingScore = 0;
        if ($totalSpent >= 500000) {
            $spendingScore = 50;
        }          // ₦500k+ = excellent
        elseif ($totalSpent >= 200000) {
            $spendingScore = 45;
        }      // ₦200k+ = very good
        elseif ($totalSpent >= 100000) {
            $spendingScore = 35;
        }      // ₦100k+ = good
        elseif ($totalSpent >= 50000) {
            $spendingScore = 25;
        }       // ₦50k+ = fair
        elseif ($totalSpent >= 10000) {
            $spendingScore = 15;
        }       // ₦10k+ = poor
        elseif ($totalSpent >= 1000) {
            $spendingScore = 10;
        } else {
            $spendingScore = 5;
        }

        // Score based on consistency (low variance is good)
        $variance = $this->calculateVariance($successfulTransactions->pluck('amount')->toArray());
        $avgScore = ($avgTransaction > 0) ? min(50, ($avgTransaction / 5000) * 10) : 0;

        return (int) ($spendingScore + $avgScore);
    }

    /**
     * Score payment reliability (0-100)
     * Checks if user pays bills on time and fulfills borrowing obligations
     */
    private function scorePaymentReliability(User $user): int
    {
        $borrowings = Borrowing::where('user_id', $user->id)->get();

        if ($borrowings->count() === 0) {
            return 50;
        } // No borrowing history = neutral

        $completedBorrowings = $borrowings->where('status', 'paid')->count();
        $overdueBorrowings = $borrowings->where('status', 'overdue')->count();
        $defaultedBorrowings = $borrowings->where('status', 'default')->count();

        $totalBorrowings = $borrowings->count();
        $completionRate = ($completedBorrowings / $totalBorrowings) * 100;

        // Heavy penalties for defaults and overdue
        $defaultPenalty = $defaultedBorrowings * 15;
        $overduePenalty = $overdueBorrowings * 10;

        $baseScore = $completionRate;

        // Bonus for each successful repayment to make growth feel dynamic
        $repaymentBonus = $completedBorrowings * 2.5;

        $finalScore = $baseScore + $repaymentBonus - $defaultPenalty - $overduePenalty;

        return max(0, min(100, (int) $finalScore));
    }

    /**
     * Score card linking (0-100)
     * Rewards users who have linked payment cards
     */
    private function scoreCardLinking(User $user): int
    {
        $activeCards = $user->cards()->where('is_active', true)->count();
        $totalCards = $user->cards()->count();

        if ($activeCards > 0) {
            if ($activeCards >= 3) {
                return 100;
            }        // 3+ cards = excellent security
            if ($activeCards >= 2) {
                return 80;
            }         // 2+ cards = very good

            return 60;                                 // 1 card = good
        }

        if ($totalCards > 0) {
            return 20;
        }               // Has cards but inactive

        return 0;                                     // No cards = poor
    }

    /**
     * Calculate variance of an array (for spending consistency)
     */
    private function calculateVariance(array $values): float
    {
        if (count($values) === 0) {
            return 0;
        }

        $mean = array_sum($values) / count($values);
        $variance = array_reduce($values, function ($carry, $value) use ($mean) {
            return $carry + pow($value - $mean, 2);
        }, 0) / count($values);

        return sqrt($variance);
    }

    /**
     * Determine credit limit based on score and financial profile
     * Uses CreditEligibilitySetting if available for the service type
     * Base eligibility: ₦500 when user links first card
     */
    public function calculateCreditLimit(User $user, int $creditScore, ?string $serviceType = null): float
    {
        // Check if user has any previous borrowings
        $hasBorrowedBefore = $user->borrowings()->count() > 0;

        // If it's the first borrowing, the limit is strictly ₦100
        if (! $hasBorrowedBefore) {
            // Check if user has active card - minimum ₦100 eligibility for first timers
            $hasActiveCard = $user->cards()->where('is_active', true)->exists();

            return $hasActiveCard ? 100 : 0;
        }

        // Check if user has active card - minimum ₦500 eligibility
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();
        $baseCardLimit = $hasActiveCard ? 500 : 0;

        // Try to get settings from database if service type provided
        if ($serviceType) {
            $setting = CreditEligibilitySetting::getByServiceType($serviceType);
            if ($setting) {
                $baseLimit = $setting->getCreditLimit($creditScore);

                if ($baseLimit === 0) {
                    // If settings-based limit is 0, use minimum card-linking eligibility
                    return $hasActiveCard ? 500 : 0;
                }

                // Adjust based on spending behavior
                $successfulTransactions = Transaction::where('user_id', $user->id)
                    ->where('status', 'success')
                    ->get();

                $totalSpent = $successfulTransactions->sum('amount');

                // High spenders get more credit
                if ($totalSpent >= 500000) {
                    $baseLimit *= 2.0;
                } elseif ($totalSpent >= 200000) {
                    $baseLimit *= 1.6;
                } elseif ($totalSpent >= 100000) {
                    $baseLimit *= 1.3;
                }

                // Adjust based on card linking (security indicator)
                $activeCards = $user->cards()->where('is_active', true)->count();
                if ($activeCards >= 2) {
                    $baseLimit *= 1.2;
                }

                return min($baseLimit, 100000); // Cap at ₦100k
            }
        }

        // Fallback to hardcoded defaults if no settings exist
        $baseLimit = 0;

        if ($creditScore >= 90) {
            $baseLimit = 50000;
        } elseif ($creditScore >= 80) {
            $baseLimit = 25000;
        } elseif ($creditScore >= 70) {
            $baseLimit = 15000;
        } elseif ($creditScore >= 60) {
            $baseLimit = 10000;
        } elseif ($creditScore >= 50) {
            $baseLimit = 5000;
        } elseif ($creditScore >= 40) {
            $baseLimit = 2000;
        } else {
            // No credit score eligibility, but allow ₦500 if card linked
            return $baseCardLimit;
        }

        // Adjust based on spending behavior
        $successfulTransactions = Transaction::where('user_id', $user->id)
            ->where('status', 'success')
            ->get();

        $totalSpent = $successfulTransactions->sum('amount');

        // High spenders get more credit
        if ($totalSpent >= 500000) {
            $baseLimit *= 2.0;
        } elseif ($totalSpent >= 200000) {
            $baseLimit *= 1.6;
        } elseif ($totalSpent >= 100000) {
            $baseLimit *= 1.3;
        }

        // Adjust based on card linking (security indicator)
        $activeCards = $user->cards()->where('is_active', true)->count();
        if ($activeCards >= 2) {
            $baseLimit *= 1.2;
        }

        return min($baseLimit, 100000); // Cap at ₦100k
    }

    /**
     * Determine eligibility status with detailed reasoning
     * Uses CreditEligibilitySetting if available for the service type
     * With card linked and minimum account age, user is eligible for borrowing
     */
    public function determineEligibility(User $user, int $creditScore, ?string $serviceType = null): array
    {
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();
        $accountAgeDays = $user->created_at->diffInDays(now());

        if (! $hasActiveCard) {
            return [
                'status' => 'not_eligible',
                'reason' => 'No active payment card linked to account',
                'action' => 'Link a payment card to proceed',
            ];
        }

        // Check if active card is expired
        $activeCard = $user->cards()->where('is_active', true)->first();
        if ($activeCard && $activeCard->isExpired()) {
            return [
                'status' => 'not_eligible',
                'reason' => 'Your linked card has expired. Please link a new card to continue borrowing.',
                'action' => 'Link a new payment card',
                'card_expired' => true,
            ];
        }

        // Check if active card is expiring soon (within 60 days)
        if ($activeCard && $activeCard->isExpiringsoon()) {
            return [
                'status' => 'eligible_with_warning',
                'reason' => 'Your account is eligible for borrowing, but your card is expiring soon',
                'action' => 'Please link a new card to ensure continuous borrowing access',
                'card_expiring_soon' => true,
                'days_until_expiration' => $activeCard->getDaysUntilExpiration(),
            ];
        }

        // Check if user has pending/active borrowings
        $pendingBorrowings = $user->borrowings()
            ->whereIn('status', ['active', 'overdue'])
            ->exists();

        if ($pendingBorrowings) {
            return [
                'status' => 'not_eligible',
                'reason' => 'You have a pending borrowing that must be repaid first',
                'action' => 'Repay your active borrowing before borrowing again',
                'has_pending_borrowing' => true,
            ];
        }

        // Get settings if service type provided
        $minAccountAgeDays = 0;
        $minCreditScore = 40; // Minimum credit score required

        if ($serviceType) {
            $setting = CreditEligibilitySetting::getByServiceType($serviceType);
            if ($setting) {
                $minAccountAgeDays = 0;
                $minCreditScore = $setting->min_credit_score;
            }
        }

        // With active card and no pending borrowings, user is eligible
        return [
            'status' => 'eligible',
            'reason' => 'Your account is eligible for borrowing with your linked card',
            'action' => null,
        ];
    }
}
