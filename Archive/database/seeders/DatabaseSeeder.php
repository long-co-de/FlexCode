<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create test user
        User::create([
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'email_verified_at' => now(),
            'wallet_balance' => 5000.00,
        ]);

        // Run other seeders
        $this->call([
            SettingsSeeder::class,
            NetworkSeeder::class,
            CableProviderSeeder::class,
            ElectricityProviderSeeder::class,
            CreditEligibilitySettingSeeder::class,
        ]);
    }
}