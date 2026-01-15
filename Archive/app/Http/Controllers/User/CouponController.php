<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CouponController extends Controller
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
        ]);

        $user = $request->user();

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

        // Check if user is locked out
        $lockoutKey = 'coupon_lockout_' . $user->id;
        $attemptsKey = 'coupon_attempts_' . $user->id;

        if (session()->has($lockoutKey)) {
            $lockoutEnd = session($lockoutKey);
            if (now()->lt($lockoutEnd)) {
                $remainingTime = now()->diffInMinutes($lockoutEnd);
                return back()->with('error', "Too many incorrect attempts. Please try again after {$remainingTime} minutes.");
            } else {
                // Lockout period has expired
                session()->forget($lockoutKey);
                session()->forget($attemptsKey);
            }
        }

        // Find the coupon
        $coupon = Coupon::where('prefix', $prefix)
            ->where('code', $code)
            ->first();

        if (!$coupon) {
            // Increment attempts
            $attempts = session($attemptsKey, 0) + 1;
            session([$attemptsKey => $attempts]);

            // Check if we need to lock the user out
            if ($attempts >= 5) {
                // Lock for 30 minutes
                $lockoutEnd = now()->addMinutes(30);
                session([$lockoutKey => $lockoutEnd]);
                return back()->with('error', 'Too many incorrect attempts. Please try again after 30 minutes.');
            }

            $remainingAttempts = 5 - $attempts;
            return back()->with('error', "Invalid treasure hunt code. You have {$remainingAttempts} " . ($remainingAttempts === 1 ? 'attempt' : 'attempts') . " left.");
        }

        // Reset attempts on successful code
        session()->forget($attemptsKey);

        if ($coupon->status !== 'active') {
            return back()->with('error', 'This treasure hunt code has already been used or has expired.');
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            $coupon->status = 'expired';
            $coupon->save();
            return back()->with('error', 'This treasure hunt code has expired.');
        }

        // Generate unique reference
        $reference = 'TREASUREHUNT' . strtoupper(Str::random(8));

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'wallet_funding',
            'amount' => $coupon->amount,
            'fee' => 0,
            'status' => 'successful',
            'recipient' => $user->email,
            'description' => 'Wallet Funding via Treasure Hunt: ' . $coupon->prefix . '-' . $coupon->code,
            'meta_data' => [
                'payment_method' => 'treasure_hunt',
                'coupon_id' => $coupon->id,
                'coupon_code' => $coupon->prefix . '-' . $coupon->code,
            ],
        ]);

        // Update coupon status
        $coupon->status = 'used';
        $coupon->used_by = $user->id;
        $coupon->used_at = now();
        $coupon->save();

        // Update user's wallet balance
        $user->wallet_balance += $coupon->amount;
        $user->save();

        return redirect()->route('wallet')
            ->with('success', 'Treasure hunt code redeemed successfully! Your wallet has been credited with ₦' . $coupon->amount);
    }
}
