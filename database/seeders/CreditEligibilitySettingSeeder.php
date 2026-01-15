<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CreditEligibilitySetting;

class CreditEligibilitySettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'service_type' => 'airtime',
                'min_credit_score' => 50,
                'credit_limit_90_plus' => 50000,
                'credit_limit_80_89' => 25000,
                'credit_limit_70_79' => 15000,
                'credit_limit_60_69' => 10000,
                'credit_limit_50_59' => 5000,
                'credit_limit_40_49' => 2000,
                'min_account_age_days' => 7,
                'min_transaction_count' => 0,
                'is_active' => true,
            ],
            [
                'service_type' => 'data',
                'min_credit_score' => 50,
                'credit_limit_90_plus' => 50000,
                'credit_limit_80_89' => 25000,
                'credit_limit_70_79' => 15000,
                'credit_limit_60_69' => 10000,
                'credit_limit_50_59' => 5000,
                'credit_limit_40_49' => 2000,
                'min_account_age_days' => 7,
                'min_transaction_count' => 0,
                'is_active' => true,
            ],
            [
                'service_type' => 'electricity',
                'min_credit_score' => 60,
                'credit_limit_90_plus' => 100000,
                'credit_limit_80_89' => 50000,
                'credit_limit_70_79' => 30000,
                'credit_limit_60_69' => 20000,
                'credit_limit_50_59' => 0,
                'credit_limit_40_49' => 0,
                'min_account_age_days' => 14,
                'min_transaction_count' => 2,
                'is_active' => true,
            ],
            [
                'service_type' => 'cable',
                'min_credit_score' => 60,
                'credit_limit_90_plus' => 80000,
                'credit_limit_80_89' => 40000,
                'credit_limit_70_79' => 25000,
                'credit_limit_60_69' => 15000,
                'credit_limit_50_59' => 0,
                'credit_limit_40_49' => 0,
                'min_account_age_days' => 14,
                'min_transaction_count' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($settings as $setting) {
            CreditEligibilitySetting::firstOrCreate(
                ['service_type' => $setting['service_type']],
                $setting
            );
        }
    }
}
