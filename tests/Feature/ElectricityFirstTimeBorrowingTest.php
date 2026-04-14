<?php

namespace Tests\Feature;

use App\Models\BorrowSetting;
use App\Models\Borrowing;
use App\Models\ElectricityProvider;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserCard;
use App\Services\DatavendroService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class ElectricityFirstTimeBorrowingTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_time_electricity_borrow_below_configured_minimum_fails(): void
    {
        $user = $this->createEligibleUser();
        $provider = ElectricityProvider::create([
            'name' => 'Ikeja Electric',
            'code' => 'ikeja-electric',
            'is_active' => true,
        ]);

        BorrowSetting::create([
            'service_type' => 'electricity',
            'min_amount' => 1000,
            'max_amount' => 20000,
            'first_time_min_amount' => 5000,
            'first_time_credit_limit' => 5000,
            'base_interest_rate' => 5,
            'good_credit_interest_rate' => 3,
            'due_days' => 30,
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);
        $response = $this->postJson('/api/mobile/v1/borrowing/electricity', [
            'meter_number' => '12345678901',
            'provider_id' => $provider->id,
            'amount' => 4000,
            'meter_type' => 'prepaid',
            'duration' => 7,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
        $this->assertStringContainsString(
            'First-time electricity borrowing must be at least',
            (string) $response->json('message')
        );
    }

    public function test_first_time_electricity_borrow_at_5000_succeeds(): void
    {
        $user = $this->createEligibleUser();
        $provider = ElectricityProvider::create([
            'name' => 'Eko Electric',
            'code' => 'eko-electric',
            'is_active' => true,
        ]);

        BorrowSetting::create([
            'service_type' => 'electricity',
            'min_amount' => 1000,
            'max_amount' => 20000,
            'first_time_min_amount' => 5000,
            'first_time_credit_limit' => 5000,
            'base_interest_rate' => 5,
            'good_credit_interest_rate' => 3,
            'due_days' => 30,
            'is_active' => true,
        ]);

        $datavendro = Mockery::mock(DatavendroService::class);
        $datavendro->shouldReceive('payElectricityBill')
            ->once()
            ->andReturn(['success' => true]);
        $this->app->instance(DatavendroService::class, $datavendro);

        Sanctum::actingAs($user);
        $response = $this->postJson('/api/mobile/v1/borrowing/electricity', [
            'meter_number' => '12345678901',
            'provider_id' => $provider->id,
            'amount' => 5000,
            'meter_type' => 'prepaid',
            'duration' => 7,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $borrowing = Borrowing::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($borrowing);
        $this->assertSame('electricity', $borrowing->type);
        $this->assertSame(5000.0, (float) $borrowing->amount);
        $this->assertGreaterThan(5000, (float) $borrowing->total_amount);
    }

    public function test_subsequent_electricity_borrow_uses_regular_minimum_not_first_time_minimum(): void
    {
        $user = $this->createEligibleUser();
        $provider = ElectricityProvider::create([
            'name' => 'Abuja Electric',
            'code' => 'abuja-electric',
            'is_active' => true,
        ]);

        BorrowSetting::create([
            'service_type' => 'electricity',
            'min_amount' => 1000,
            'max_amount' => 20000,
            'first_time_min_amount' => 5000,
            'first_time_credit_limit' => 5000,
            'base_interest_rate' => 5,
            'good_credit_interest_rate' => 3,
            'due_days' => 30,
            'is_active' => true,
        ]);

        Borrowing::create([
            'user_id' => $user->id,
            'reference' => 'BORHISTORY001',
            'type' => 'electricity',
            'amount' => 5000,
            'interest_rate' => 10,
            'total_amount' => 5500,
            'service_details' => json_encode(['meter' => '12345678901']),
            'transaction_details' => ['meter' => '12345678901'],
            'due_date' => now()->subDay(),
            'status' => 'paid',
            'repaid_at' => now()->subDay(),
        ]);

        for ($i = 1; $i <= 12; $i++) {
            Transaction::create([
                'user_id' => $user->id,
                'reference' => 'TXHISTORY' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'type' => 'wallet_funding',
                'amount' => 5000,
                'status' => 'success',
                'description' => 'Score-building transaction',
            ]);
        }

        $datavendro = Mockery::mock(DatavendroService::class);
        $datavendro->shouldReceive('payElectricityBill')
            ->once()
            ->andReturn(['success' => true]);
        $this->app->instance(DatavendroService::class, $datavendro);

        Sanctum::actingAs($user);
        $response = $this->postJson('/api/mobile/v1/borrowing/electricity', [
            'meter_number' => '10987654321',
            'provider_id' => $provider->id,
            'amount' => 1000,
            'meter_type' => 'prepaid',
            'duration' => 7,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    private function createEligibleUser(): User
    {
        $user = User::factory()->create([
            'phone_number' => '08012345678',
        ]);

        UserCard::create([
            'user_id' => $user->id,
            'card_type' => 'visa',
            'last_four' => '4242',
            'authorization_code' => 'AUTH_' . uniqid(),
            'email' => $user->email,
            'bank' => 'Test Bank',
            'bin' => '424242',
            'card_token' => 'CARD_' . uniqid(),
            'is_default' => true,
            'is_active' => true,
            'is_expired' => false,
            'metadata' => [],
        ]);

        return $user;
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
