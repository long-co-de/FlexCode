<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\Coupon;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class CouponController extends AtomicController
{
    /**
     * Redeem a coupon to fund the user's wallet.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function redeem(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'request_id' => 'nullable|string',
        ]);

        $user = $request->user();

        // **SECURITY FIX 1: Rate limiting**
        if ($this->isRateLimited($user->id, 'coupon_redemption', maxAttempts: 5, decaySeconds: 300)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        // **SECURITY FIX 2: Deduplication**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'coupon_redemption')) {
            return back()->with('error', 'This request is already being processed.');
        }

        // Extract prefix and code
        $fullCode = $request->code;
        $prefix = 'PI'; // Default prefix

        // Check if the code includes a prefix
        if (strpos($fullCode, '-') !== false) {
            $parts = explode('-', $fullCode);
            $prefix = $parts[0];
            $code = $parts[1];
        } else {
            $code = $fullCode;
        }

        // Check if user is locked out via session (UI-level protection)
        $lockoutKey = 'coupon_lockout_' . $user->id;
        $attemptsKey = 'coupon_attempts_' . $user->id;

        if (session()->has($lockoutKey)) {
            $lockoutEnd = session($lockoutKey);
            if (now()->lt($lockoutEnd)) {
                $remainingTime = now()->diffInMinutes($lockoutEnd);
                return back()->with('error', "Too many incorrect attempts. Please try again after {$remainingTime} minutes.");
            } else {
                session()->forget($lockoutKey);
                session()->forget($attemptsKey);
            }
        }

        try {
            return DB::transaction(function () use ($user, $prefix, $code, $attemptsKey, $lockoutKey) {
                // **SECURITY FIX 3: Lock the coupon row to prevent race conditions**
                $coupon = Coupon::where('prefix', $prefix)
                    ->where('code', $code)
                    ->lockForUpdate()
                    ->first();

                if (!$coupon) {
                    // Increment attempts in session
                    $attempts = session($attemptsKey, 0) + 1;
                    session([$attemptsKey => $attempts]);

                    if ($attempts >= 5) {
                        $lockoutEnd = now()->addMinutes(30);
                        session([$lockoutKey => $lockoutEnd]);
                        throw new \Exception('Too many incorrect attempts. Please try again after 30 minutes.');
                    }

                    $remainingAttempts = 5 - $attempts;
                    throw new \Exception("Invalid treasure hunt code. You have {$remainingAttempts} " . ($remainingAttempts === 1 ? 'attempt' : 'attempts') . " left.");
                }

                if ($coupon->status !== 'active') {
                    throw new \Exception('This treasure hunt code has already been used or has expired.');
                }

                if ($coupon->expires_at && $coupon->expires_at->isPast()) {
                    $coupon->status = 'expired';
                    $coupon->save();
                    throw new \Exception('This treasure hunt code has expired.');
                }

                // **SECURITY FIX 4: Lock the user row**
                $lockedUser = \App\Models\User::where('id', $user->id)->lockForUpdate()->firstOrFail();

                // Reset attempts on successful code
                session()->forget($attemptsKey);

                // Generate unique reference
                $reference = 'TREASUREHUNT' . strtoupper(Str::random(8)) . time();

                // Create transaction record
                Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'wallet_funding',
                    'amount' => $coupon->amount,
                    'fee' => 0,
                    'status' => 'successful',
                    'recipient' => $lockedUser->email,
                    'description' => 'Wallet Funding via Treasure Hunt: ' . $coupon->prefix . '-' . $coupon->code,
                    'meta_data' => [
                        'payment_method' => 'treasure_hunt',
                        'coupon_id' => $coupon->id,
                        'coupon_code' => $coupon->prefix . '-' . $coupon->code,
                    ],
                ]);

                // Update coupon status
                $coupon->status = 'used';
                $coupon->used_by = $lockedUser->id;
                $coupon->used_at = now();
                $coupon->save();

                // Update user's wallet balance using helper
                $this->creditWallet($lockedUser, $coupon->amount, 'Treasure Hunt Redemption');

                return redirect()->route('wallet')
                    ->with('success', 'Treasure hunt code redeemed successfully! Your wallet has been credited with ₦' . $coupon->amount);
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
