<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Network;
use App\Models\DataPlan;
use App\Models\AirtimeDiscount;

class NetworkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // MTN
        $mtn = Network::create([
            'name' => 'MTN',
            'code' => 'mtn',
            'logo' => 'networks/mtn.png',
            'is_active' => true,
        ]);

        // MTN Airtime Discount
        AirtimeDiscount::create([
            'network_id' => $mtn->id,
            'discount_percentage' => 2.0,
            'min_amount' => 50,
            'max_amount' => 50000,
            'is_active' => true,
        ]);

        // MTN Data Plans
        $mtnDataPlans = [
            [
                'name' => 'MTN 1GB',
                'code' => 'mtn-1gb',
                'price' => 250,
                'selling_price' => 262.50,
                'validity' => '30 days',
                'data_amount' => '1GB',
                'is_active' => true,
            ],
            [
                'name' => 'MTN 2GB',
                'code' => 'mtn-2gb',
                'price' => 500,
                'selling_price' => 525,
                'validity' => '30 days',
                'data_amount' => '2GB',
                'is_active' => true,
            ],
            [
                'name' => 'MTN 5GB',
                'code' => 'mtn-5gb',
                'price' => 1200,
                'selling_price' => 1260,
                'validity' => '30 days',
                'data_amount' => '5GB',
                'is_active' => true,
            ],
        ];

        foreach ($mtnDataPlans as $plan) {
            DataPlan::create(array_merge($plan, ['network_id' => $mtn->id]));
        }

        // Airtel
        $airtel = Network::create([
            'name' => 'Airtel',
            'code' => 'airtel',
            'logo' => 'networks/airtel.png',
            'is_active' => true,
        ]);

        // Airtel Airtime Discount
        AirtimeDiscount::create([
            'network_id' => $airtel->id,
            'discount_percentage' => 2.0,
            'min_amount' => 50,
            'max_amount' => 50000,
            'is_active' => true,
        ]);

        // Airtel Data Plans
        $airtelDataPlans = [
            [
                'name' => 'Airtel 1GB',
                'code' => 'airtel-1gb',
                'price' => 250,
                'selling_price' => 262.50,
                'validity' => '30 days',
                'data_amount' => '1GB',
                'is_active' => true,
            ],
            [
                'name' => 'Airtel 2GB',
                'code' => 'airtel-2gb',
                'price' => 500,
                'selling_price' => 525,
                'validity' => '30 days',
                'data_amount' => '2GB',
                'is_active' => true,
            ],
            [
                'name' => 'Airtel 5GB',
                'code' => 'airtel-5gb',
                'price' => 1200,
                'selling_price' => 1260,
                'validity' => '30 days',
                'data_amount' => '5GB',
                'is_active' => true,
            ],
        ];

        foreach ($airtelDataPlans as $plan) {
            DataPlan::create(array_merge($plan, ['network_id' => $airtel->id]));
        }

        // Glo
        $glo = Network::create([
            'name' => 'Glo',
            'code' => 'glo',
            'logo' => 'networks/glo.png',
            'is_active' => true,
        ]);

        // Glo Airtime Discount
        AirtimeDiscount::create([
            'network_id' => $glo->id,
            'discount_percentage' => 2.0,
            'min_amount' => 50,
            'max_amount' => 50000,
            'is_active' => true,
        ]);

        // Glo Data Plans
        $gloDataPlans = [
            [
                'name' => 'Glo 1GB',
                'code' => 'glo-1gb',
                'price' => 250,
                'selling_price' => 262.50,
                'validity' => '30 days',
                'data_amount' => '1GB',
                'is_active' => true,
            ],
            [
                'name' => 'Glo 2GB',
                'code' => 'glo-2gb',
                'price' => 500,
                'selling_price' => 525,
                'validity' => '30 days',
                'data_amount' => '2GB',
                'is_active' => true,
            ],
            [
                'name' => 'Glo 5GB',
                'code' => 'glo-5gb',
                'price' => 1200,
                'selling_price' => 1260,
                'validity' => '30 days',
                'data_amount' => '5GB',
                'is_active' => true,
            ],
        ];

        foreach ($gloDataPlans as $plan) {
            DataPlan::create(array_merge($plan, ['network_id' => $glo->id]));
        }

        // 9mobile
        $mobile9 = Network::create([
            'name' => '9mobile',
            'code' => '9mobile',
            'logo' => 'networks/9mobile.png',
            'is_active' => true,
        ]);

        // 9mobile Airtime Discount
        AirtimeDiscount::create([
            'network_id' => $mobile9->id,
            'discount_percentage' => 2.0,
            'min_amount' => 50,
            'max_amount' => 50000,
            'is_active' => true,
        ]);

        // 9mobile Data Plans
        $mobile9DataPlans = [
            [
                'name' => '9mobile 1GB',
                'code' => '9mobile-1gb',
                'price' => 250,
                'selling_price' => 262.50,
                'validity' => '30 days',
                'data_amount' => '1GB',
                'is_active' => true,
            ],
            [
                'name' => '9mobile 2GB',
                'code' => '9mobile-2gb',
                'price' => 500,
                'selling_price' => 525,
                'validity' => '30 days',
                'data_amount' => '2GB',
                'is_active' => true,
            ],
            [
                'name' => '9mobile 5GB',
                'code' => '9mobile-5gb',
                'price' => 1200,
                'selling_price' => 1260,
                'validity' => '30 days',
                'data_amount' => '5GB',
                'is_active' => true,
            ],
        ];

        foreach ($mobile9DataPlans as $plan) {
            DataPlan::create(array_merge($plan, ['network_id' => $mobile9->id]));
        }
    }
}