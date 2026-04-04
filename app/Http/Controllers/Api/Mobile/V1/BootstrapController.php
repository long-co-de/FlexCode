<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\UserCardResource;
use App\Http\Resources\Mobile\V1\UserResource;
use App\Models\Transaction;
use App\Models\User;

class BootstrapController extends Controller
{
    public function __invoke()
    {
        return $this->success($this->payloadFor(request()->user()), 'Bootstrap payload fetched successfully.');
    }

    public function payloadFor(User $user): array
    {
        $user->loadMissing(['borrowingEligibility', 'cards']);

        $walletFundingTotal = (float) Transaction::where('user_id', $user->id)
            ->where('type', 'wallet_funding')
            ->whereIn('status', ['success', 'successful'])
            ->sum('amount');

        return [
            'profile' => new UserResource($user),
            'wallet' => [
                'balance' => (float) $user->wallet_balance,
                'virtual_accounts' => array_values($user->virtual_account_details ?? []),
                'total_funded' => $walletFundingTotal,
            ],
            'notifications' => [
                'unread_count' => $user->unreadNotifications()->count(),
            ],
            'cards' => [
                'has_active_card' => $user->cards()->where('is_active', true)->exists(),
                'default_card' => $user->cards()->where('is_default', true)->exists()
                    ? new UserCardResource($user->cards()->where('is_default', true)->first())
                    : null,
            ],
            'borrowing' => [
                'eligibility' => $user->borrowingEligibility ? [
                    'is_eligible' => $user->borrowingEligibility->isEligible(),
                    'credit_limit' => (float) $user->borrowingEligibility->credit_limit,
                    'available_credit' => (float) $user->borrowingEligibility->available_credit,
                    'credit_score' => (int) $user->borrowingEligibility->credit_score,
                    'rejection_reason' => $user->borrowingEligibility->rejection_reason,
                ] : null,
                'summary' => [
                    'total_borrowed' => (float) $user->borrowings()->sum('amount'),
                    'total_repaid' => (float) $user->borrowings()->where('status', 'paid')->sum('amount'),
                    'active_borrowings' => $user->activeBorrowings()->count(),
                    'overdue_borrowings' => $user->overdueBorrowings()->count(),
                    'total_due' => (float) $user->activeBorrowings()->sum('total_amount'),
                ],
            ],
        ];
    }
}
