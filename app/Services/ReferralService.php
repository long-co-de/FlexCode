<?php

namespace App\Services;

use App\Models\User;
use App\Models\Transaction;
use App\Notifications\ReferralBonusEarned;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReferralService
{
    /**
     * Calculate and credit referral bonus when a referred user makes their first deposit
     * 4% of the first deposit amount
     *
     * @param Transaction $transaction
     * @return bool
     */
    public function processReferralBonus(Transaction $transaction): bool
    {
        try {
            // Only process wallet funding transactions
            if ($transaction->type !== 'wallet_funding' || $transaction->status !== 'successful') {
                return false;
            }

            $user = $transaction->user;

            // Check if user was referred
            if (!$user->referred_by) {
                return false;
            }

            $referrer = User::find($user->referred_by);
            if (!$referrer) {
                return false;
            }

            // Check if this is the user's first deposit
            $previousDeposits = Transaction::where('user_id', $user->id)
                ->where('type', 'wallet_funding')
                ->where('status', 'successful')
                ->where('id', '!=', $transaction->id)
                ->count();

            // Only credit bonus for first deposit
            if ($previousDeposits > 0) {
                return false;
            }

            // Calculate 4% bonus
            $bonusAmount = ($transaction->amount * 4) / 100;

            // Create referral commission transaction
            DB::transaction(function () use ($referrer, $user, $bonusAmount, $transaction) {
                // Create commission transaction
                Transaction::create([
                    'user_id' => $referrer->id,
                    'reference' => 'REF-' . $transaction->reference,
                    'type' => 'commission',
                    'amount' => $bonusAmount,
                    'status' => 'successful',
                    'description' => "Referral bonus (4%) from user {$user->name}'s first deposit",
                    'referral_user_id' => $user->id,
                    'meta_data' => json_encode([
                        'referred_user_id' => $user->id,
                        'referred_user_name' => $user->name,
                        'original_transaction_id' => $transaction->id,
                        'deposit_amount' => $transaction->amount,
                        'bonus_percentage' => 4,
                    ]),
                ]);

                // Update referrer's earnings
                $referrer->increment('total_referral_earnings', $bonusAmount);
                $referrer->increment('wallet_balance', $bonusAmount);
            });

            // Send email notification to referrer
            $referrer->notify(new ReferralBonusEarned($referrer->name, $bonusAmount, $user->name, $transaction->amount));

            return true;
        } catch (\Exception $e) {
            Log::error('Referral bonus processing failed', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get referral statistics for a user
     *
     * @param User $user
     * @return array
     */
    public function getReferralStats(User $user): array
    {
        $referrals = User::where('referred_by', $user->id)->get();

        $totalReferred = $referrals->count();
        $activeReferred = $referrals->where('wallet_balance', '>', 0)->count();
        
        $totalEarnings = $user->total_referral_earnings ?? 0;
        $pendingEarnings = $user->pending_referral_earnings ?? 0;

        return [
            'total_referred_users' => $totalReferred,
            'active_referred_users' => $activeReferred,
            'total_earnings' => $totalEarnings,
            'pending_earnings' => $pendingEarnings,
            'referral_code' => $user->referral_code,
        ];
    }

    /**
     * Calculate 4% bonus from deposit amount
     *
     * @param float $depositAmount
     * @return float
     */
    public function getBonusAmount(float $depositAmount): float
    {
        return ($depositAmount * 4) / 100;
    }
}
