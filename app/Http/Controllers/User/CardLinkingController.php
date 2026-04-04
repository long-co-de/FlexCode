<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\UserCard;
use App\Models\User;
use App\Services\CardLinkingService;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CardLinkingController extends AtomicController
{
    protected $paystackService;
    protected $cardLinkingService;

    public function __construct(PaystackService $paystackService, CardLinkingService $cardLinkingService)
    {
        $this->paystackService = $paystackService;
        $this->cardLinkingService = $cardLinkingService;
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
            'request_id' => 'nullable|string',
        ]);

        // **SECURITY FIX 1: Deduplication**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'card_linking')) {
            return response()->json([
                'success' => false,
                'message' => 'This request is already being processed.',
            ], 400);
        }

        try {
            // Start transaction for atomicity
            DB::beginTransaction();

            // **SECURITY FIX 2: Lock user row**
            $lockedUser = User::where('id', $user->id)->lockForUpdate()->firstOrFail();

            // Verify the transaction with Paystack
            $verification = $this->paystackService->verifyTransaction($validated['reference']);

            if (!$verification['success']) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed. Please contact support.',
                ], 400);
            }

            $paymentData = $verification['data'];

            // Ensure payment was successful
            if ($paymentData['status'] !== 'success') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Payment was not completed successfully.',
                ], 400);
            }

            // Get authorization data from payment
            $authorization = $paymentData['authorization'] ?? null;

            if (!$authorization) {
                DB::rollBack();
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
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'This card type is not supported for borrowing.',
                ], 400);
            }

            // Check if card is already registered to another user (prevent card reuse across accounts)
            $authCode = $authorization['authorization_code'] ?? '';
            $cardUsedByAnotherUser = UserCard::where('authorization_code', $authCode)
                ->where('user_id', '!=', $lockedUser->id)
                ->where('is_active', true)
                ->lockForUpdate() // Lock existing card check too
                ->first();

            if ($cardUsedByAnotherUser) {
                DB::rollBack();
                Log::warning('Card reuse attempt detected', [
                    'user_id' => $lockedUser->id,
                    'existing_user_id' => $cardUsedByAnotherUser->user_id,
                    'authorization_code' => $authCode,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'This card is already registered to another account. Please use a different card.',
                ], 400);
            }

            // Check if card already exists for this user
            $existingCard = UserCard::where('user_id', $lockedUser->id)
                ->where('authorization_code', $authCode)
                ->lockForUpdate()
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
                            'request_id' => $requestId,
                        ]),
                    ]);
                    $card = $existingCard;
                }
            } else {
                // Create new card record
                $isFirstCard = !$lockedUser->cards()->exists();

                // Generate a unique card token
                $cardToken = $authorization['card_token'] ?? null;
                if (!$cardToken || empty($cardToken)) {
                    $cardToken = hash('sha256', $lockedUser->id . '|' . ($authorization['authorization_code'] ?? '') . '|' . time());
                }

                $card = UserCard::create([
                    'user_id' => $lockedUser->id,
                    'card_type' => $authorization['card_type'] ?? 'unknown',
                    'last_four' => $authorization['last4'] ?? '',
                    'authorization_code' => $authorization['authorization_code'] ?? '',
                    'email' => $lockedUser->email,
                    'bank' => $authorization['bank'] ?? 'Unknown Bank',
                    'bin' => $authorization['bin'] ?? '',
                    'exp_month' => $authorization['exp_month'] ?? '',
                    'exp_year' => $authorization['exp_year'] ?? '',
                    'expires_at' => $this->calculateExpirationDate($authorization['exp_month'] ?? '', $authorization['exp_year'] ?? ''),
                    'card_token' => $cardToken,
                    'is_default' => $isFirstCard,
                    'is_active' => true,
                    'is_expired' => false,
                    'metadata' => [
                        'verified_at' => now()->toDateTimeString(),
                        'payment_reference' => $paymentData['id'] ?? '',
                        'customer_id' => $paymentData['customer']['id'] ?? null,
                        'paystack_auth_code' => $authorization['authorization_code'] ?? '',
                        'request_id' => $requestId,
                    ],
                ]);

                // Credit user ₦50 if it's their first card linked
            }

            // Process refund of verification charge (₦100)
            $this->recordUserCardLinkingTransaction($card, $requestId);
            $this->processVerificationRefund($lockedUser, $paymentData);

            // Recalculate borrowing eligibility
            $this->recalculateEligibility($lockedUser);

            DB::commit();

            Log::info('Card linked successfully', [
                'user_id' => $lockedUser->id,
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
                'message' => 'An error occurred: ' . $e->getMessage(),
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
                // Create an admin-visible refund record while keeping the user-facing history on card linking only.
                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'wallet_credit',
                    'amount' => 100,
                    'reference' => 'REF_CARD_LINK_' . ($paymentData['id'] ?? uniqid()),
                    'status' => 'pending',
                    'description' => 'Card linking verification charge refund',
                    'meta_data' => [
                        'original_payment_id' => $paymentData['id'] ?? '',
                        'reason' => 'card_verification_refund',
                        'admin_only' => true,
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

    protected function recordUserCardLinkingTransaction(UserCard $card, string $requestId): void
    {
        $transaction = $this->cardLinkingService->recordCardLinkingTransaction($card);

        if (!$transaction) {
            return;
        }

        $metaData = $transaction->meta_data ?? [];
        $metaData['request_id'] = $requestId;
        $transaction->meta_data = $metaData;
        $transaction->save();
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

    /**
     * Calculate expiration date from exp_month and exp_year
     */
    protected function calculateExpirationDate(?string $expMonth, ?string $expYear): ?\DateTime
    {
        if (!$expMonth || !$expYear) {
            return null;
        }

        try {
            // Ensure expMonth is 2 digits
            $expMonth = str_pad($expMonth, 2, '0', STR_PAD_LEFT);
            
            // Check if year is 2 or 4 digits
            $format = (strlen($expYear) === 4) ? 'm/Y' : 'm/y';
            
            // Parse expiration date - cards expire at end of the month
            return \Carbon\Carbon::createFromFormat($format, $expMonth . '/' . $expYear)
                ->endOfMonth();
        } catch (\Exception $e) {
            Log::warning('Failed to calculate card expiration date', [
                'exp_month' => $expMonth,
                'exp_year' => $expYear,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Delete expired or expiring cards and handle user restrictions
     */
    public function deleteExpiredCards(\App\Models\User $user): int
    {
        $deletedCount = 0;
        $expiredCards = $user->cards()
            ->where(function ($query) {
                $query->where('is_expired', true)
                    ->orWhere('expires_at', '<', now());
            })
            ->get();

        foreach ($expiredCards as $card) {
            try {
                // Mark as expired first
                $card->markAsExpired();

                // Increase user's credit score due to expired card
                $this->increaseScoreForExpiredCard($user, $card);

                // Delete the card
                $card->delete();
                $deletedCount++;

                Log::info('Expired card deleted', [
                    'user_id' => $user->id,
                    'card_id' => $card->id,
                    'last_four' => $card->last_four,
                ]);
            } catch (\Exception $e) {
                Log::error('Error deleting expired card', [
                    'user_id' => $user->id,
                    'card_id' => $card->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Recalculate eligibility if any cards were deleted
        if ($deletedCount > 0) {
            $this->recalculateEligibility($user);
        }

        return $deletedCount;
    }

    /**
     * Increase user's credit score when card expires
     */
    protected function increaseScoreForExpiredCard(\App\Models\User $user, \App\Models\UserCard $card): void
    {
        try {
            $eligibility = $user->borrowingEligibility;

            if ($eligibility) {
                // Increase credit score by 5 points when card expires
                $newScore = min(100, $eligibility->credit_score + 5);
                $eligibility->update([
                    'credit_score' => $newScore,
                ]);

                // Log the credit score increase
                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit_score_adjustment',
                    'amount' => 5,
                    'reference' => 'CARD_EXPIRED_SCORE_' . uniqid(),
                    'status' => 'success',
                    'description' => 'Credit score increased due to card expiration',
                    'metadata' => [
                        'card_last_four' => $card->last_four,
                        'reason' => 'card_expired',
                        'previous_score' => $eligibility->credit_score,
                        'new_score' => $newScore,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error increasing credit score for expired card', [
                'user_id' => $user->id,
                'card_id' => $card->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check for expiring or expired cards and handle them
     */
    public function checkCardExpiration(\App\Models\User $user): array
    {
        $activeCard = $user->cards()->where('is_active', true)->first();

        if (!$activeCard) {
            return [
                'has_active_card' => false,
                'is_expired' => false,
                'is_expiring_soon' => false,
                'days_remaining' => null,
            ];
        }

        // Check if card is expired or expiring
        $isExpired = $activeCard->isExpired();
        $isExpiringSoon = !$isExpired && $activeCard->isExpiringsoon();
        $daysRemaining = $activeCard->getDaysUntilExpiration();

        return [
            'has_active_card' => true,
            'is_expired' => $isExpired,
            'is_expiring_soon' => $isExpiringSoon,
            'days_remaining' => $daysRemaining,
            'card_last_four' => $activeCard->last_four,
        ];
    }
}
