<?php

namespace Tests\Feature;

use App\Models\Borrowing;
use App\Models\MobileDevice;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_login_returns_token_and_bootstrap_payload(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08012345678',
            'wallet_balance' => 5000,
        ]);

        $response = $this->postJson('/api/mobile/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'phone_number'],
                    'bootstrap' => [
                        'profile',
                        'wallet',
                        'notifications',
                        'cards',
                        'borrowing',
                    ],
                ],
            ]);
    }

    public function test_bootstrap_returns_unread_count_and_card_summary(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08011112222',
        ]);
        $user->notifyNow(new SystemNotification('Title', 'Body', 'info'));

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/mobile/v1/bootstrap');

        $response->assertOk()
            ->assertJsonPath('data.notifications.unread_count', 1)
            ->assertJsonPath('data.cards.has_active_card', false);
    }

    public function test_mobile_funding_init_returns_checkout_url(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08033334444',
        ]);

        $mock = Mockery::mock(PaystackService::class);
        $mock->shouldReceive('initializeTransaction')
            ->once()
            ->andReturn([
                'success' => true,
                'data' => [
                    'authorization_url' => 'https://paystack.test/checkout/abc',
                    'access_code' => 'access_123',
                ],
            ]);
        $this->app->instance(PaystackService::class, $mock);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/mobile/v1/wallet/funding/init', [
            'amount' => 5000,
            'request_id' => 'funding_req_12345678901234567890',
            'redirect_url' => 'borrowlite://payments',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.checkout.authorization_url', 'https://paystack.test/checkout/abc');

        $this->assertDatabaseHas('wallet_fundings', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_mobile_transactions_normalize_success_status(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08055556666',
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'reference' => 'TESTREF123',
            'type' => 'wallet_funding',
            'amount' => 1000,
            'status' => 'success',
            'description' => 'Test transaction',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/mobile/v1/transactions');

        $response->assertOk()
            ->assertJsonPath('data.0.status', 'successful')
            ->assertJsonPath('data.0.raw_status', 'success');
    }

    public function test_mobile_device_registration_and_deactivation(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08077778888',
        ]);

        Sanctum::actingAs($user);

        $storeResponse = $this->postJson('/api/mobile/v1/devices', [
            'expo_push_token' => 'ExponentPushToken[test-token]',
            'platform' => 'android',
            'device_name' => 'Pixel',
            'app_version' => '1.0.0',
        ]);

        $storeResponse->assertCreated()
            ->assertJsonPath('data.platform', 'android');

        $deviceId = MobileDevice::firstOrFail()->id;

        $deleteResponse = $this->deleteJson('/api/mobile/v1/devices/' . $deviceId);

        $deleteResponse->assertOk();
        $this->assertDatabaseHas('mobile_devices', [
            'id' => $deviceId,
            'is_active' => false,
        ]);
    }

    public function test_legacy_wallet_history_includes_transfer_and_withdrawal_types(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08099990000',
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'reference' => 'TRX1',
            'type' => 'wallet_transfer',
            'amount' => 300,
            'status' => 'successful',
            'description' => 'Transfer',
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'reference' => 'TRX2',
            'type' => 'withdrawal',
            'amount' => 500,
            'status' => 'pending',
            'description' => 'Withdrawal',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/wallet/history');

        $response->assertOk()
            ->assertJsonCount(2, 'transactions.data');
    }

    public function test_legacy_my_borrowings_api_route_returns_json_payload(): void
    {
        $user = User::factory()->create([
            'phone_number' => '08012121212',
        ]);

        Borrowing::create([
            'user_id' => $user->id,
            'reference' => 'BORTEST001',
            'type' => 'airtime',
            'amount' => 1000,
            'interest_rate' => 10,
            'total_amount' => 1100,
            'service_details' => json_encode(['phone' => '08012345678']),
            'transaction_details' => ['phone' => '08012345678'],
            'due_date' => now()->addDays(7),
            'status' => 'active',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/borrowing/my-borrowings');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'borrowings.data');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
