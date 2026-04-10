<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\User\CardController as LegacyCardController;
use App\Http\Controllers\User\CardLinkingController;
use App\Http\Resources\Mobile\V1\UserCardResource;
use App\Models\Transaction;
use App\Models\UserCard;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CardController extends Controller
{
    public function index(Request $request)
    {
        $cards = $request->user()->cards()->orderByDesc('is_default')->get();

        return $this->success(UserCardResource::collection($cards), 'Cards fetched successfully.');
    }

    public function initializeLink(Request $request, PaystackService $paystackService)
    {
        $request->validate([
            'request_id' => 'required|string|min:20|max:100',
            'redirect_url' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $reference = 'CARDLINK' . strtoupper(Str::random(8)) . time();

        Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'card_linking_init',
            'is_card_link_transaction' => true,
            'amount' => 100,
            'status' => 'pending',
            'recipient' => $user->email,
            'description' => 'Mobile card linking verification charge',
            'meta_data' => [
                'request_id' => $request->request_id,
                'redirect_url' => $request->redirect_url,
                'channel' => 'mobile_api',
            ],
        ]);

        $callbackUrl = route('mobile.api.v1.payments.return', [
            'reference' => $reference,
            'context' => 'card_link',
            'redirect_url' => $request->redirect_url,
        ]);

        $payment = $paystackService->initializeTransaction(
            100,
            $user->email,
            $reference,
            $callbackUrl,
            [
                'context' => 'card_link',
                'user_id' => $user->id,
                'request_id' => $request->request_id,
            ]
        );

        if (! ($payment['success'] ?? false)) {
            Transaction::where('reference', $reference)->update([
                'status' => 'failed',
                'meta_data' => [
                    'request_id' => $request->request_id,
                    'redirect_url' => $request->redirect_url,
                    'channel' => 'mobile_api',
                    'initialization_error' => $payment['message'] ?? 'Unable to initialize card linking.',
                ],
            ]);

            return $this->error($payment['message'] ?? 'Unable to initialize card linking.', 'CARD_LINK_INIT_FAILED', 400);
        }

        Transaction::where('reference', $reference)->update([
            'meta_data' => [
                'request_id' => $request->request_id,
                'redirect_url' => $request->redirect_url,
                'channel' => 'mobile_api',
                'authorization_url' => $payment['data']['authorization_url'] ?? null,
                'access_code' => $payment['data']['access_code'] ?? null,
            ],
        ]);

        return $this->success([
            'reference' => $reference,
            'status' => 'pending',
            'verification_fee' => [
                'amount' => 100,
                'is_refunded' => false,
            ],
            'checkout' => [
                'authorization_url' => $payment['data']['authorization_url'] ?? null,
                'access_code' => $payment['data']['access_code'] ?? null,
            ],
        ], 'Card linking initialized successfully. A N100 card-linking fee will be charged.', 201);
    }

    public function linkStatus(Request $request, string $reference, PaystackService $paystackService, CardLinkingController $cardLinkingController)
    {
        $linkPayload = [];
        $initTransaction = Transaction::where('reference', $reference)
            ->where('user_id', $request->user()->id)
            ->where('type', 'card_linking_init')
            ->firstOrFail();

        if ($initTransaction->status === 'pending') {
            $verification = $paystackService->verifyTransaction($reference);

            if (($verification['success'] ?? false) && (($verification['data']['status'] ?? null) === 'success')) {
                $linkRequest = Request::create('/api/mobile/v1/cards/link/' . $reference . '/status', 'POST', [
                    'reference' => $reference,
                    'status' => 'success',
                    'request_id' => $initTransaction->meta_data['request_id'] ?? null,
                ]);
                $linkRequest->setUserResolver(fn () => $request->user());

                $linkResponse = $cardLinkingController->linkFromPayment($linkRequest);
                $linkPayload = $linkResponse->getData(true);

                if (($linkPayload['success'] ?? false) === true) {
                    $initTransaction->status = 'successful';
                    $initTransaction->meta_data = array_merge($initTransaction->meta_data ?? [], [
                        'provider_response' => $verification['data'],
                        'completed_at' => now()->toIso8601String(),
                    ]);
                    $initTransaction->save();
                } else {
                    $initTransaction->status = 'failed';
                    $initTransaction->meta_data = array_merge($initTransaction->meta_data ?? [], [
                        'provider_response' => $verification['data'],
                        'link_error' => $linkPayload['message'] ?? 'Card linking failed.',
                    ]);
                    $initTransaction->save();
                }
            }
        }

        $activeCard = $request->user()->cards()->where('is_active', true)->latest()->first();

        return $this->success([
            'reference' => $reference,
            'status' => $initTransaction->status,
            'card' => $activeCard ? new UserCardResource($activeCard) : null,
            'reward' => $linkPayload['data']['reward'] ?? null,
            'verification_fee' => $linkPayload['data']['verification_fee'] ?? [
                'amount' => 100,
                'is_refunded' => false,
            ],
        ], 'Card link status fetched successfully.');
    }

    public function claimReward(Request $request, CardLinkingController $cardLinkingController)
    {
        $rewardRequest = Request::create('/api/mobile/v1/cards/link/reward', 'POST', $request->only([
            'network_id',
            'request_id',
        ]));
        $rewardRequest->setUserResolver(fn () => $request->user());

        $response = $cardLinkingController->claimReward($rewardRequest);
        $payload = $response->getData(true);

        if (($payload['success'] ?? false) !== true) {
            return $this->error(
                $payload['message'] ?? 'Unable to send airtime reward.',
                'CARD_LINK_REWARD_FAILED',
                $response->getStatusCode(),
                ['data' => $payload['data'] ?? null]
            );
        }

        return $this->success($payload['data'] ?? null, $payload['message'] ?? 'Reward delivered successfully.');
    }

    public function setDefault(Request $request, UserCard $card, LegacyCardController $controller)
    {
        $response = $controller->setDefault($card);
        $payload = $response->getData(true);

        if (($payload['success'] ?? false) !== true) {
            return $this->error($payload['message'] ?? 'Unable to set default card.', 'SET_DEFAULT_CARD_FAILED', $response->getStatusCode());
        }

        return $this->success(new UserCardResource($card->fresh()), 'Default card updated successfully.');
    }

    public function destroy(Request $request, UserCard $card, LegacyCardController $controller)
    {
        $response = $controller->destroy($card);
        $payload = $response->getData(true);

        if (($payload['success'] ?? false) !== true) {
            return $this->error($payload['message'] ?? 'Unable to delete card.', 'DELETE_CARD_FAILED', $response->getStatusCode());
        }

        return $this->success(null, 'Card removed successfully.');
    }
}
