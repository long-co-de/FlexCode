<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserCard;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CardLinkingController extends Controller
{
    protected $paystackService;

    public function __construct(PaystackService $paystackService)
    {
        $this->paystackService = $paystackService;
        // $this->middleware('auth');
    }

    /**
     * Show the card linking page.
     */
    public function show(Request $request)
    {
        $user = Auth::user();
        
        // Check if user already has an active card
        if ($user->cards()->where('is_active', true)->exists()) {
            return redirect()->route('cards.index')
                ->with('info', 'You already have an active linked card.');
        }

        return Inertia::render('User/Cards/LinkCard', [
            'paystackPublicKey' => config('services.paystack.public_key'),
            'userEmail' => $user->email,
            'returnUrl' => $request->query('return_to', route('borrow.airtime')),
        ]);
    }

    /**
     * Handle Paystack callback and link the card.
     * This is called after successful Paystack payment.
     */
    public function linkFromPayment(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'reference' => 'required|string',
            'status' => 'required|string',
        ]);

        try {
            // Start transaction for atomicity
            DB::beginTransaction();

            // Verify the transaction with Paystack
            $verification = $this->paystackService->verifyTransaction($validated['reference']);

            if (!$verification['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed. Please contact support.',
                ], 400);
            }

            $paymentData = $verification['data'];

            // Ensure payment was successful
            if ($paymentData['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment was not completed successfully.',
                ], 400);
            }

            // Get authorization data from payment
            $authorization = $paymentData['authorization'] ?? null;

            if (!$authorization) {
                Log::error('No authorization data in Paystack response', [
                    'reference' => $validated['reference'],
                    'payment_data' => $paymentData,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Card authorization failed. Please try again.',
                ], 400);
            }

            // Verify authorization is reusable
            if (!($authorization['reusable'] ?? false)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This card type is not supported for borrowing.',
                ], 400);
            }

            // Check if card already exists for this user
            $existingCard = UserCard::where('user_id', $user->id)
                ->where('authorization_code', $authorization['authorization_code'] ?? '')
                ->first();

            if ($existingCard) {
                if ($existingCard->is_active) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'This card is already linked to your account.',
                    ], 400);
                } else {
                    // Reactivate existing card
                    $existingCard->update([
                        'is_active' => true,
                        'metadata' => array_merge($existingCard->metadata ?? [], [
                            'reactivated_at' => now()->toDateTimeString(),
                            'payment_reference' => $paymentData['id'] ?? '',
                        ]),
                    ]);
                    $card = $existingCard;
                }
            } else {
                // Create new card record
                $isFirstCard = !$user->cards()->exists();

                $card = UserCard::create([
                    'user_id' => $user->id,
                    'card_type' => $authorization['card_type'] ?? 'unknown',
                    'last_four' => $authorization['last4'] ?? '',
                    'authorization_code' => $authorization['authorization_code'] ?? '',
                    'email' => $user->email,
                    'bank' => $authorization['bank'] ?? 'Unknown Bank',
                    'bin' => $authorization['bin'] ?? '',
                    'card_token' => $authorization['card_token'] ?? '',
                    'is_default' => $isFirstCard,
                    'is_active' => true,
                    'metadata' => [
                        'exp_month' => $authorization['exp_month'] ?? '',
                        'exp_year' => $authorization['exp_year'] ?? '',
                        'verified_at' => now()->toDateTimeString(),
                        'payment_reference' => $paymentData['id'] ?? '',
                        'customer_id' => $paymentData['customer']['id'] ?? null,
                        'paystack_auth_code' => $authorization['authorization_code'] ?? '',
                    ],
                ]);
            }

            // Process refund of verification charge (₦100)
            $this->processVerificationRefund($user, $paymentData);

            // Recalculate borrowing eligibility
            $this->recalculateEligibility($user);

            DB::commit();

            Log::info('Card linked successfully', [
                'user_id' => $user->id,
                'card_id' => $card->id,
                'last_four' => $card->last_four,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Card linked successfully!',
                'data' => [
                    'card' => $card->only(['id', 'card_type', 'last_four', 'bank', 'is_default']),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Card linking error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'reference' => $validated['reference'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while linking your card. Please try again.',
            ], 500);
        }
    }

    /**
     * Process refund of ₦100 verification charge.
     */
    protected function processVerificationRefund($user, $paymentData)
    {
        try {
            $amount = ($paymentData['amount'] ?? 0) / 100; // Convert from kobo to naira

            // Only refund if the exact verification amount was charged
            if ($amount == 100) {
                // Create refund transaction
                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'wallet_credit',
                    'amount' => 100,
                    'reference' => 'REF_CARD_LINK_' . $paymentData['id'] ?? uniqid(),
                    'status' => 'pending',
                    'description' => 'Card linking verification charge refund',
                    'metadata' => [
                        'original_payment_id' => $paymentData['id'] ?? '',
                        'reason' => 'card_verification_refund',
                    ],
                ]);

                // In production, you may want to use Paystack transfers API for automatic refund
                // For now, this creates a pending transaction that admin can process
            }
        } catch (\Exception $e) {
            Log::error('Refund processing error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - card is already linked successfully
        }
    }

    /**
     * Recalculate borrowing eligibility after card linking.
     */
    protected function recalculateEligibility($user)
    {
        try {
            $eligibilityService = app(\App\Services\BorrowingEligibilityService::class);
            $eligibilityService->checkEligibility($user);
        } catch (\Exception $e) {
            Log::error('Eligibility recalculation error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - card is still linked
        }
    }

    /**
     * Check if user has active card, redirect to linking if not.
     * Can be used before borrowing operations.
     */
    public function ensureCardLinked()
    {
        $user = Auth::user();
        
        if (!$user->cards()->where('is_active', true)->exists()) {
            return redirect()->route('cards.link', [
                'return_to' => url()->previous(),
            ])->with('warning', 'Please link a payment card to continue.');
        }

        return null;
    }

    /**
     * API endpoint to check if user has active card.
     */
    public function checkCardStatus()
    {
        $user = Auth::user();
        $activeCard = $user->cards()->where('is_active', true)->first();

        return response()->json([
            'success' => true,
            'hasActiveCard' => (bool) $activeCard,
            'card' => $activeCard ? $activeCard->only(['id', 'last_four', 'bank', 'card_type']) : null,
        ]);
    }
}
