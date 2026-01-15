<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Beneficiary;
use App\Models\User;
use App\Models\Network;

class BeneficiarySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::find(10); // Use the first user for demo
        $network = Network::first(); // Use the first network for demo

        Beneficiary::create([
            'user_id' => $user->id,
            'name' => 'John Data',
            'phone_number' => '08031234567',
            'service_type' => 'data',
            'network_id' => $network->id,
            'is_favorite' => true,
            'meta_data' => null,
        ]);

        Beneficiary::create([
            'user_id' => $user->id,
            'name' => 'Jane Airtime',
            'phone_number' => '08039876543',
            'service_type' => 'airtime',
            'network_id' => $network->id,
            'is_favorite' => false,
            'meta_data' => null,
        ]);

        Beneficiary::create([
            'user_id' => $user->id,
            'name' => 'Cable Guy',
            'phone_number' => '08035551234',
            'service_type' => 'cable',
            'network_id' => null,
            'is_favorite' => false,
            'meta_data' => [
                'cable_number' => '1234567890',
            ],
        ]);

        Beneficiary::create([
            'user_id' => $user->id,
            'name' => 'Power User',
            'phone_number' => '08034443322',
            'service_type' => 'electricity',
            'network_id' => null,
            'is_favorite' => false,
            'meta_data' => [
                'meter_number' => '9876543210',
                'meter_type' => 'prepaid',
            ],
        ]);
    }
}
