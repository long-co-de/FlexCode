<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Services\ReferralService;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function __construct(
        protected ReferralService $referralService
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $stats = $this->referralService->getReferralStats($user);

        $referredUsers = $user->referrals()
            ->select('id', 'name', 'email', 'phone_number', 'wallet_balance', 'created_at')
            ->get()
            ->map(function ($referredUser) {
                $firstDeposit = $referredUser->transactions()
                    ->where('type', 'wallet_funding')
                    ->whereIn('status', ['success', 'successful'])
                    ->oldest('created_at')
                    ->first();

                return [
                    'id' => $referredUser->id,
                    'name' => $referredUser->name,
                    'email' => $referredUser->email,
                    'phone_number' => $referredUser->phone_number,
                    'wallet_balance' => (float) $referredUser->wallet_balance,
                    'created_at' => optional($referredUser->created_at)?->toIso8601String(),
                    'has_deposited' => (bool) $firstDeposit,
                    'first_deposit_date' => optional($firstDeposit?->created_at)?->toIso8601String(),
                ];
            });

        $earnings = $user->transactions()
            ->where('type', 'commission')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($transaction) => [
                'id' => $transaction->id,
                'amount' => (float) $transaction->amount,
                'description' => $transaction->description,
                'referred_user' => $transaction->meta_data['referred_user_name'] ?? 'Unknown User',
                'deposit_amount' => (float) ($transaction->meta_data['deposit_amount'] ?? 0),
                'created_at' => optional($transaction->created_at)?->toIso8601String(),
            ]);

        return $this->success([
            'stats' => $stats,
            'referral_link' => config('app.url') . '/?code=' . $user->referral_code,
            'referral_code' => $user->referral_code,
            'referred_users' => $referredUsers,
            'earnings' => $earnings,
        ], 'Referral data fetched successfully.');
    }
}
