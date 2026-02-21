<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ElectricityProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;
use App\Jobs\ProcessElectricityPurchase;

class ElectricityApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Setup a user for testing
        $this->user = User::factory()->create([
            'wallet_balance' => 10000,
            'pin' => Hash::make('1234'),
        ]);

        // Setup a provider
        $this->provider = ElectricityProvider::create([
            'name' => 'Eko Electric',
            'code' => 'eko',
            'service_fee' => 100,
            'is_active' => true,
        ]);
    }

    public function test_electricity_purchase_api_sends_correct_payload_to_vendor()
    {
        Queue::fake();

        $payload = [
            'provider_id' => $this->provider->id,
            'meter_number' => '01325857801000000',
            'meter_type' => 'prepaid',
            'amount' => 5000,
            'customer_name' => 'John Doe',
            'customer_address' => '123 Test St',
            'phone_number' => '08012345678',
            'pin' => '1234',
            'request_id' => 'TEST_REQ_' . str_repeat('A', 15), // Ensure it's at least 20 chars
        ];

        $response = $this->actingAs($this->user)
            ->withHeaders(['X-PIN' => '1234'])
            ->postJson('/api/services/electricity/purchase', $payload);

        $response->assertStatus(202)
            ->assertJsonPath('success', true)
            ->assertJsonPath('status', 'pending');

        Queue::assertPushed(ProcessElectricityPurchase::class, function ($job) {
            return $job->queue === 'electricity';
        });
    }
}
