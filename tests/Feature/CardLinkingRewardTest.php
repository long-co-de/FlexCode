<?php

namespace Tests\Feature;

use App\Models\Network;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserCard;
use App\Services\DatavendroService;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class CardLinkingRewardTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_successful_card_link_marks_n50_airtime_reward_pending(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08012345678',
        ]);

        $paystack = Mockery::mock(PaystackService::class);
        $paystack->shouldReceive('verifyTransaction')
            ->once()
            ->andReturn($this->successfulPaystackVerification('AUTHCODE1'));
        $this->app->instance(PaystackService::class, $paystack);

        $response = $this->actingAs($user)->postJson(route('cards.link-from-payment'), [
            'reference' => 'PAYSTACK-REF-1',
            'status' => 'success',
            'request_id' => 'card_link_request_12345678901234567890',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.verification_fee.is_refunded', false)
            ->assertJsonPath('data.reward.eligible', true)
            ->assertJsonPath('data.reward.status', 'pending_network_selection')
            ->assertJsonPath('data.reward.requires_network_selection', true)
            ->assertJsonPath('data.reward.phone_number', '08012345678');

        $cardLinkTransaction = Transaction::where('user_id', $user->id)
            ->where('type', 'card_linking')
            ->first();

        $this->assertNotNull($cardLinkTransaction);
        $this->assertSame('pending_network_selection', $cardLinkTransaction->meta_data['card_link_reward']['status']);

        $this->assertDatabaseMissing('transactions', [
            'user_id' => $user->id,
            'type' => 'wallet_credit',
        ]);
    }

    public function test_subsequent_card_link_does_not_offer_reward_again(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08012345678',
        ]);

        UserCard::create([
            'user_id' => $user->id,
            'card_type' => 'visa',
            'last_four' => '1111',
            'authorization_code' => 'OLD-AUTH',
            'email' => $user->email,
            'bank' => 'Test Bank',
            'exp_month' => '12',
            'exp_year' => '30',
            'card_token' => 'existing-token',
            'is_default' => true,
            'is_active' => true,
            'is_expired' => false,
            'metadata' => [],
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'reference' => 'CARD-LINK-OLD',
            'type' => 'card_linking',
            'is_card_link_transaction' => true,
            'amount' => 0,
            'status' => 'successful',
            'description' => 'Existing card linking',
            'meta_data' => [
                'card_link_reward' => [
                    'eligible' => true,
                    'type' => 'airtime',
                    'amount' => 50,
                    'status' => 'claimed',
                ],
            ],
        ]);

        $paystack = Mockery::mock(PaystackService::class);
        $paystack->shouldReceive('verifyTransaction')
            ->once()
            ->andReturn($this->successfulPaystackVerification('AUTHCODE2'));
        $this->app->instance(PaystackService::class, $paystack);

        $response = $this->actingAs($user)->postJson(route('cards.link-from-payment'), [
            'reference' => 'PAYSTACK-REF-2',
            'status' => 'success',
            'request_id' => 'card_link_request_22345678901234567890',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.reward.eligible', false)
            ->assertJsonPath('data.reward.status', 'not_applicable');
    }

    public function test_reward_claim_sends_airtime_and_marks_reward_claimed(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08012345678',
        ]);

        $network = Network::create([
            'name' => 'MTN',
            'code' => 'mtn',
            'is_active' => true,
        ]);

        $cardLinkTransaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => 'CARD-LINK-CLAIM',
            'type' => 'card_linking',
            'is_card_link_transaction' => true,
            'amount' => 0,
            'status' => 'successful',
            'description' => 'Card linking',
            'meta_data' => [
                'card_link_reward' => [
                    'eligible' => true,
                    'type' => 'airtime',
                    'amount' => 50,
                    'phone_number' => '08012345678',
                    'status' => 'pending_network_selection',
                    'message' => 'Select your network to receive your N50 airtime reward.',
                ],
            ],
        ]);

        $datavendro = Mockery::mock(DatavendroService::class);
        $datavendro->shouldReceive('buyAirtime')
            ->once()
            ->andReturn([
                'success' => true,
                'data' => ['id' => 'reward-airtime-id'],
                'api_transaction_id' => 'reward-airtime-id',
                'api_status' => 'successful',
                'message' => 'Airtime purchase successful',
            ]);
        $this->app->instance(DatavendroService::class, $datavendro);

        $response = $this->actingAs($user)->postJson(route('cards.link-reward'), [
            'network_id' => $network->id,
            'request_id' => 'card_reward_request_12345678901234567890',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.reward.status', 'claimed')
            ->assertJsonPath('data.reward.network_name', 'MTN')
            ->assertJsonPath('data.transaction.status', 'successful');

        $cardLinkTransaction->refresh();
        $this->assertSame('claimed', $cardLinkTransaction->meta_data['card_link_reward']['status']);
        $this->assertSame('MTN', $cardLinkTransaction->meta_data['card_link_reward']['network_name']);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'type' => 'airtime',
            'status' => 'successful',
            'reference' => $response->json('data.transaction.reference'),
        ]);
    }

    public function test_reward_claim_failure_keeps_reward_retryable(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08012345678',
        ]);

        $network = Network::create([
            'name' => 'Airtel',
            'code' => 'airtel',
            'is_active' => true,
        ]);

        $cardLinkTransaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => 'CARD-LINK-FAIL',
            'type' => 'card_linking',
            'is_card_link_transaction' => true,
            'amount' => 0,
            'status' => 'successful',
            'description' => 'Card linking',
            'meta_data' => [
                'card_link_reward' => [
                    'eligible' => true,
                    'type' => 'airtime',
                    'amount' => 50,
                    'phone_number' => '08012345678',
                    'status' => 'pending_network_selection',
                    'message' => 'Select your network to receive your N50 airtime reward.',
                ],
            ],
        ]);

        $datavendro = Mockery::mock(DatavendroService::class);
        $datavendro->shouldReceive('buyAirtime')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Provider is unavailable',
            ]);
        $this->app->instance(DatavendroService::class, $datavendro);

        $response = $this->actingAs($user)->postJson(route('cards.link-reward'), [
            'network_id' => $network->id,
            'request_id' => 'card_reward_request_22345678901234567890',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('data.reward.status', 'failed')
            ->assertJsonPath('data.reward.can_retry', true)
            ->assertJsonPath('data.reward.last_error', 'Provider is unavailable');

        $cardLinkTransaction->refresh();
        $this->assertSame('failed', $cardLinkTransaction->meta_data['card_link_reward']['status']);
    }

    protected function successfulPaystackVerification(string $authorizationCode): array
    {
        return [
            'success' => true,
            'data' => [
                'status' => 'success',
                'amount' => 10000,
                'id' => 'paystack_payment_id',
                'customer' => [
                    'id' => 'paystack_customer_id',
                ],
                'authorization' => [
                    'authorization_code' => $authorizationCode,
                    'reusable' => true,
                    'card_type' => 'visa',
                    'last4' => '4242',
                    'bank' => 'Test Bank',
                    'bin' => '408408',
                    'exp_month' => '12',
                    'exp_year' => '30',
                    'card_token' => 'token-' . $authorizationCode,
                ],
            ],
        ];
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
