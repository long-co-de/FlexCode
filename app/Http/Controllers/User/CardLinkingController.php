<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\Network;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserCard;
use App\Services\CardLinkingService;
use App\Services\DatavendroService;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
    }

    /**
     * Show the card linking page.
     */
    public function show(Request $request)
    {
        $user = Auth::user();

        if ($user->cards()->where('is_active', true)->exists()) {
            return redirect()->route('cards.index')
                ->with('info', 'You already have an active linked card.');
        }

        return Inertia::render('User/Cards/LinkCard', [
            'paystackPublicKey' => config('services.paystack.public_key'),
            'userEmail' => $user->email,
            'userPhoneNumber' => $user->phone_number,
            'networks' => Network::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'logo']),
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

        $requestId = $validated['request_id'] ?? $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'card_linking')) {
            return response()->json([
                'success' => false,
                'message' => 'This request is already being processed.',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $lockedUser = User::where('id', $user->id)->lockForUpdate()->firstOrFail();
            $verification = $this->paystackService->verifyTransaction($validated['reference']);

            if (! ($verification['success'] ?? false)) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed. Please contact support.',
                ], 400);
            }

            $paymentData = $verification['data'];
            $verificationAmount = (int) (($paymentData['amount'] ?? 0) / 100);

            if (($paymentData['status'] ?? null) !== 'success') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Payment was not completed successfully.',
                ], 400);
            }

            if ($verificationAmount !== 100) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Card linking requires a successful N100 verification fee.',
                ], 400);
            }

            $authorization = $paymentData['authorization'] ?? null;

            if (! $authorization) {
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

            if (! ($authorization['reusable'] ?? false)) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'This card type is not supported for borrowing.',
                ], 400);
            }

            $authCode = $authorization['authorization_code'] ?? '';
            $cardUsedByAnotherUser = UserCard::where('authorization_code', $authCode)
                ->where('user_id', '!=', $lockedUser->id)
                ->where('is_active', true)
                ->lockForUpdate()
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
                }

                $existingCard->update([
                    'is_active' => true,
                    'metadata' => array_merge($existingCard->metadata ?? [], [
                        'reactivated_at' => now()->toDateTimeString(),
                        'payment_reference' => $paymentData['id'] ?? '',
                        'request_id' => $requestId,
                    ]),
                ]);
                $card = $existingCard;
            } else {
                $isFirstCard = ! $lockedUser->cards()->exists();
                $cardToken = $authorization['card_token'] ?? null;

                if (! $cardToken) {
                    $cardToken = hash(
                        'sha256',
                        $lockedUser->id . '|' . ($authorization['authorization_code'] ?? '') . '|' . time()
                    );
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
                    'expires_at' => $this->calculateExpirationDate(
                        $authorization['exp_month'] ?? '',
                        $authorization['exp_year'] ?? ''
                    ),
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
            }

            $rewardMeta = $this->buildCardLinkRewardMeta(
                $lockedUser,
                ! $existingCard && ! $this->hasReceivedCardLinkReward($lockedUser->id)
            );

            $transaction = $this->recordUserCardLinkingTransaction($card, $requestId, $rewardMeta);

            if (! $transaction) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Card linked, but we could not record the transaction. Please contact support.',
                ], 500);
            }

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
                    'card' => $card->only(['id', 'card_type', 'last_four', 'bank', 'is_default', 'is_active', 'is_expired', 'expires_at']),
                    'verification_fee' => [
                        'amount' => 100,
                        'is_refunded' => false,
                        'message' => 'N100 card-linking fee charged successfully.',
                    ],
                    'reward' => $this->formatRewardResponse($transaction),
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

    public function claimReward(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'network_id' => 'required|exists:networks,id',
            'request_id' => 'nullable|string',
        ]);

        $requestId = $validated['request_id'] ?? $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'card_link_reward_claim')) {
            return response()->json([
                'success' => false,
                'message' => 'This reward request is already being processed.',
            ], 400);
        }

        if (! preg_match('/^[0-9]{11}$/', (string) $user->phone_number)) {
            return response()->json([
                'success' => false,
                'message' => 'Add a valid phone number to your profile before claiming your N50 airtime reward.',
            ], 422);
        }

        $network = Network::where('id', $validated['network_id'])
            ->where('is_active', true)
            ->firstOrFail();

        try {
            $rewardTransaction = null;

            DB::transaction(function () use ($user, $network, $requestId, &$rewardTransaction) {
                $cardLinkTransaction = $this->getLatestRewardEligibleCardLinkTransaction($user->id, true);

                if (! $cardLinkTransaction) {
                    throw new \RuntimeException('No pending card-link airtime reward found.');
                }

                $rewardMeta = $cardLinkTransaction->meta_data['card_link_reward'] ?? [];
                $rewardStatus = $rewardMeta['status'] ?? null;

                if (! in_array($rewardStatus, ['pending_network_selection', 'failed'], true)) {
                    throw new \RuntimeException('This reward is no longer available.');
                }

                $rewardMeta['status'] = 'processing';
                $rewardMeta['network_id'] = $network->id;
                $rewardMeta['network_name'] = $network->name;
                $rewardMeta['request_id'] = $requestId;
                $rewardMeta['last_attempted_at'] = now()->toIso8601String();

                $metaData = $cardLinkTransaction->meta_data ?? [];
                $metaData['card_link_reward'] = $rewardMeta;
                $cardLinkTransaction->meta_data = $metaData;
                $cardLinkTransaction->save();

                $rewardReference = 'AIRREWARD' . strtoupper(Str::random(8)) . time();

                $rewardTransaction = Transaction::create([
                    'user_id' => $user->id,
                    'reference' => $rewardReference,
                    'type' => 'airtime',
                    'amount' => 0,
                    'fee' => 0,
                    'profit' => 0,
                    'status' => 'pending',
                    'recipient' => $user->phone_number,
                    'description' => "Card-link reward airtime of N50 to {$user->phone_number}",
                    'meta_data' => [
                        'network' => $network->name,
                        'network_code' => $network->code,
                        'phone_number' => $user->phone_number,
                        'amount' => 50,
                        'amount_paid' => 0,
                        'airtime_type' => 'VTU',
                        'reward_source' => 'card_linking',
                        'card_link_transaction_id' => $cardLinkTransaction->id,
                        'request_id' => $requestId,
                    ],
                ]);
            });

            $airtimeResponse = app(DatavendroService::class)->buyAirtime(
                $user->phone_number,
                $network->code,
                50,
                $rewardTransaction->reference,
                'VTU',
                false
            );

            DB::transaction(function () use ($user, $network, $requestId, $rewardTransaction, $airtimeResponse) {
                $cardLinkTransaction = $this->getLatestRewardEligibleCardLinkTransaction($user->id, true);

                if (! $cardLinkTransaction) {
                    throw new \RuntimeException('Unable to update card-link reward state.');
                }

                $rewardMeta = $cardLinkTransaction->meta_data['card_link_reward'] ?? [];

                if ($airtimeResponse['success'] ?? false) {
                    $rewardTransaction->status = 'successful';
                    $rewardTransaction->meta_data = array_merge($rewardTransaction->meta_data ?? [], [
                        'response' => $airtimeResponse,
                        'api_transaction_id' => $airtimeResponse['api_transaction_id']
                            ?? ($airtimeResponse['data']['id'] ?? ($airtimeResponse['data']['ident'] ?? null)),
                        'api_status' => $airtimeResponse['api_status'] ?? null,
                        'completed_at' => now(),
                    ]);
                    $rewardTransaction->save();

                    $rewardMeta['status'] = 'claimed';
                    $rewardMeta['claimed_at'] = now()->toIso8601String();
                    $rewardMeta['network_id'] = $network->id;
                    $rewardMeta['network_name'] = $network->name;
                    $rewardMeta['reward_transaction_id'] = $rewardTransaction->id;
                    $rewardMeta['reward_reference'] = $rewardTransaction->reference;
                    $rewardMeta['message'] = 'N50 airtime reward delivered successfully.';
                    unset($rewardMeta['last_error']);
                } else {
                    $rewardTransaction->status = 'failed';
                    $rewardTransaction->meta_data = array_merge($rewardTransaction->meta_data ?? [], [
                        'error_response' => $airtimeResponse,
                        'failed_at' => now(),
                    ]);
                    $rewardTransaction->save();

                    $rewardMeta['status'] = 'failed';
                    $rewardMeta['network_id'] = $network->id;
                    $rewardMeta['network_name'] = $network->name;
                    $rewardMeta['last_error'] = $airtimeResponse['message'] ?? 'Failed to deliver reward airtime.';
                    $rewardMeta['last_failed_at'] = now()->toIso8601String();
                    $rewardMeta['message'] = 'We could not deliver your N50 airtime reward. Please try again.';
                }

                $rewardMeta['request_id'] = $requestId;

                $metaData = $cardLinkTransaction->meta_data ?? [];
                $metaData['card_link_reward'] = $rewardMeta;
                $cardLinkTransaction->meta_data = $metaData;
                $cardLinkTransaction->save();
            });

            $rewardState = $this->getLatestRewardEligibleCardLinkTransaction($user->id);

            if (! ($airtimeResponse['success'] ?? false)) {
                return response()->json([
                    'success' => false,
                    'message' => $airtimeResponse['message'] ?? 'Failed to send your N50 airtime reward. Please try again.',
                    'data' => [
                        'reward' => $rewardState ? $this->formatRewardResponse($rewardState) : null,
                    ],
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'N50 airtime reward delivered successfully.',
                'data' => [
                    'reward' => $rewardState ? $this->formatRewardResponse($rewardState) : null,
                    'transaction' => [
                        'reference' => $rewardTransaction->reference,
                        'status' => $rewardTransaction->status,
                    ],
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Card-link reward claim error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending your airtime reward.',
            ], 500);
        }
    }

    protected function recordUserCardLinkingTransaction(UserCard $card, string $requestId, array $rewardMeta): ?Transaction
    {
        return $this->cardLinkingService->recordCardLinkingTransaction($card, $rewardMeta, $requestId);
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
        }
    }

    /**
     * Check if user has active card, redirect to linking if not.
     * Can be used before borrowing operations.
     */
    public function ensureCardLinked()
    {
        $user = Auth::user();

        if (! $user->cards()->where('is_active', true)->exists()) {
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
        $rewardTransaction = $this->getLatestRewardEligibleCardLinkTransaction($user->id);

        return response()->json([
            'success' => true,
            'hasActiveCard' => (bool) $activeCard,
            'card' => $activeCard ? $activeCard->only(['id', 'last_four', 'bank', 'card_type']) : null,
            'reward' => $rewardTransaction ? $this->formatRewardResponse($rewardTransaction) : null,
        ]);
    }

    protected function buildCardLinkRewardMeta(User $user, bool $isEligible): array
    {
        if (! $isEligible) {
            return [
                'eligible' => false,
                'type' => 'airtime',
                'amount' => 50,
                'status' => 'not_applicable',
                'message' => 'Airtime reward is only available on the first successful card link.',
            ];
        }

        if (! preg_match('/^[0-9]{11}$/', (string) $user->phone_number)) {
            return [
                'eligible' => true,
                'type' => 'airtime',
                'amount' => 50,
                'phone_number' => $user->phone_number,
                'status' => 'blocked_missing_phone',
                'message' => 'Add a valid phone number to your profile to receive your N50 airtime reward.',
            ];
        }

        return [
            'eligible' => true,
            'type' => 'airtime',
            'amount' => 50,
            'phone_number' => $user->phone_number,
            'status' => 'pending_network_selection',
            'message' => 'Select your network to receive your N50 airtime reward.',
        ];
    }

    protected function hasReceivedCardLinkReward(int $userId): bool
    {
        return Transaction::where('user_id', $userId)
            ->where('type', 'card_linking')
            ->exists();
    }

    protected function getLatestRewardEligibleCardLinkTransaction(int $userId, bool $lockForUpdate = false): ?Transaction
    {
        $query = Transaction::where('user_id', $userId)
            ->where('type', 'card_linking')
            ->latest('id');

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->get()->first(function (Transaction $transaction) {
            $reward = $transaction->meta_data['card_link_reward'] ?? null;

            return is_array($reward)
                && ($reward['eligible'] ?? false)
                && in_array($reward['status'] ?? null, ['pending_network_selection', 'processing', 'failed', 'claimed', 'blocked_missing_phone'], true);
        });
    }

    protected function formatRewardResponse(Transaction $transaction): array
    {
        $reward = $transaction->meta_data['card_link_reward'] ?? [];
        $status = $reward['status'] ?? 'not_applicable';

        return [
            'type' => $reward['type'] ?? 'airtime',
            'amount' => (int) ($reward['amount'] ?? 50),
            'eligible' => (bool) ($reward['eligible'] ?? false),
            'status' => $status,
            'phone_number' => $reward['phone_number'] ?? null,
            'network_id' => $reward['network_id'] ?? null,
            'network_name' => $reward['network_name'] ?? null,
            'message' => $reward['message'] ?? null,
            'requires_network_selection' => $status === 'pending_network_selection',
            'is_claimed' => $status === 'claimed',
            'can_retry' => $status === 'failed',
            'reward_transaction_id' => $reward['reward_transaction_id'] ?? null,
            'reward_reference' => $reward['reward_reference'] ?? null,
            'last_error' => $reward['last_error'] ?? null,
        ];
    }

    /**
     * Calculate expiration date from exp_month and exp_year
     */
    protected function calculateExpirationDate(?string $expMonth, ?string $expYear): ?\DateTime
    {
        if (! $expMonth || ! $expYear) {
            return null;
        }

        try {
            $expMonth = str_pad($expMonth, 2, '0', STR_PAD_LEFT);
            $format = (strlen($expYear) === 4) ? 'm/Y' : 'm/y';

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
                $card->markAsExpired();
                $this->increaseScoreForExpiredCard($user, $card);
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
                $newScore = min(100, $eligibility->credit_score + 5);
                $eligibility->update([
                    'credit_score' => $newScore,
                ]);

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

        if (! $activeCard) {
            return [
                'has_active_card' => false,
                'is_expired' => false,
                'is_expiring_soon' => false,
                'days_remaining' => null,
            ];
        }

        $isExpired = $activeCard->isExpired();
        $isExpiringSoon = ! $isExpired && $activeCard->isExpiringsoon();
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
