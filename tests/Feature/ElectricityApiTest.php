<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ElectricityProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;

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
        Http::fake([
            'https://datavendor.ng/api/billpayment/' => Http::response([
                'Status' => 'success',
                'api_response' => 'Transaction Successful',
                'data' => [
                    'token' => '1234-5678-9012-3456',
                    'units' => '50.5'
                ]
            ], 200)
        ]);

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

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify SystemProfit was recorded
        $this->assertDatabaseHas('system_profits', [
            'user_id' => $this->user->id,
            'profit_source' => 'electricity',
            'status' => 'recorded',
        ]);

        // Verify the vendor request
        Http::assertSent(function ($request) {
            return $request->url() === 'https://datavendor.ng/api/billpayment/' &&
                   $request->method() === 'POST' &&
                   $request->hasHeader('Authorization', 'Token 8b0db02d232377ca7c7dd354e30b41a423f7201d') &&
                   $request['meter_number'] === '01325857801000000' &&
                   $request['MeterType'] === 'Prepaid';
        });
    }
}
