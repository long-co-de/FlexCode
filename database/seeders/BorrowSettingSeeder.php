<?php

namespace Database\Seeders;

use App\Models\BorrowSetting;
use Illuminate\Database\Seeder;

class BorrowSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'service_type' => 'airtime',
                'min_amount' => 50,
                'max_amount' => 10000,
                'first_time_min_amount' => 100,
                'first_time_credit_limit' => 100,
                'base_interest_rate' => 5,
                'good_credit_interest_rate' => 3,
                'due_days' => 30,
                'is_active' => true,
            ],
            [
                'service_type' => 'data',
                'min_amount' => 50,
                'max_amount' => 10000,
                'first_time_min_amount' => 100,
                'first_time_credit_limit' => 100,
                'base_interest_rate' => 5,
                'good_credit_interest_rate' => 3,
                'due_days' => 30,
                'is_active' => true,
            ],
            [
                'service_type' => 'electricity',
                'min_amount' => 1000,
                'max_amount' => 20000,
                'first_time_min_amount' => 5000,
                'first_time_credit_limit' => 5000,
                'base_interest_rate' => 5,
                'good_credit_interest_rate' => 3,
                'due_days' => 30,
                'is_active' => true,
            ],
            [
                'service_type' => 'cable',
                'min_amount' => 1000,
                'max_amount' => 20000,
                'first_time_min_amount' => 100,
                'first_time_credit_limit' => 100,
                'base_interest_rate' => 5,
                'good_credit_interest_rate' => 3,
                'due_days' => 30,
                'is_active' => true,
            ],
        ];

        foreach ($settings as $setting) {
            BorrowSetting::updateOrCreate(
                ['service_type' => $setting['service_type']],
                $setting
            );
        }
    }
}
