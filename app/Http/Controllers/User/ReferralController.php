<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferralController extends Controller
{
    /**
     * Display the referral management page.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $referralService = app(ReferralService::class);
        $referralStats = $referralService->getReferralStats($user);

        // Get all referred users with their deposit status
        $referredUsers = User::where('referred_by', $user->id)
            ->select('id', 'name', 'email', 'phone_number', 'wallet_balance', 'created_at')
            ->get()
            ->map(function ($referredUser) use ($user) {
                $firstDeposit = $referredUser->transactions()
                    ->where('type', 'wallet_funding')
                    ->where('status', 'successful')
                    ->orderBy('created_at')
                    ->first();

                return [
                    'id' => $referredUser->id,
                    'name' => $referredUser->name,
                    'email' => $referredUser->email,
                    'phone_number' => $referredUser->phone_number,
                    'wallet_balance' => $referredUser->wallet_balance,
                    'created_at' => $referredUser->created_at,
                    'has_deposited' => (bool) $firstDeposit,
                    'first_deposit_date' => $firstDeposit?->created_at,
                ];
            });

        // Get referral earnings transactions
        $referralEarnings = $user->transactions()
            ->where('type', 'commission')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'created_at' => $transaction->created_at,
                    'description' => $transaction->description,
                    'referred_user' => isset($transaction->meta_data['referred_user_name']) 
                        ? $transaction->meta_data['referred_user_name'] 
                        : 'Unknown User',
                    'deposit_amount' => $transaction->meta_data['deposit_amount'] ?? 0,
                ];
            });

        return Inertia::render('User/Referral/Index', [
            'referralStats' => $referralStats,
            'referredUsers' => $referredUsers,
            'referralEarnings' => $referralEarnings,
            'referralUrl' => route('register') . '?code=' . $user->referral_code,
        ]);
    }

    /**
     * Share referral code via WhatsApp.
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function shareWhatsapp(Request $request)
    {
        $user = $request->user();
        $message = "I'm using BorrowLite and it's amazing! 🚀 Get instant airtime, data, and loans. Join with my code: {$user->referral_code}";
        $whatsappUrl = "https://wa.me/?text=" . urlencode($message);
        
        return redirect($whatsappUrl);
    }

    /**
     * Get referral link for sharing.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLink(Request $request)
    {
        $user = $request->user();
        $baseUrl = config('app.url');
        $referralLink = $baseUrl . '/?code=' . $user->referral_code;

        return response()->json([
            'link' => $referralLink,
            'code' => $user->referral_code,
        ]);
    }
}
