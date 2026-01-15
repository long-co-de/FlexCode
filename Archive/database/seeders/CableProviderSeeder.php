<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CableProvider;
use App\Models\CablePlan;

class CableProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // DSTV
        $dstv = CableProvider::create([
            'name' => 'DSTV',
            'code' => 'dstv',
            'logo' => 'cable/dstv.png',
            'is_active' => true,
        ]);

        // DSTV Plans
        $dstvPlans = [
            [
                'name' => 'DSTV Padi',
                'code' => 'dstv-padi',
                'price' => 2150,
                'selling_price' => 2214.50,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'DSTV Yanga',
                'code' => 'dstv-yanga',
                'price' => 3500,
                'selling_price' => 3605,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'DSTV Confam',
                'code' => 'dstv-confam',
                'price' => 6200,
                'selling_price' => 6386,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'DSTV Compact',
                'code' => 'dstv-compact',
                'price' => 10500,
                'selling_price' => 10815,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'DSTV Premium',
                'code' => 'dstv-premium',
                'price' => 21000,
                'selling_price' => 21630,
                'validity' => '1 month',
                'is_active' => true,
            ],
        ];

        foreach ($dstvPlans as $plan) {
            CablePlan::create(array_merge($plan, ['cable_provider_id' => $dstv->id]));
        }

        // GOTV
        $gotv = CableProvider::create([
            'name' => 'GOTV',
            'code' => 'gotv',
            'logo' => 'cable/gotv.png',
            'is_active' => true,
        ]);

        // GOTV Plans
        $gotvPlans = [
            [
                'name' => 'GOTV Lite',
                'code' => 'gotv-lite',
                'price' => 1100,
                'selling_price' => 1133,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'GOTV Jinja',
                'code' => 'gotv-jinja',
                'price' => 2250,
                'selling_price' => 2317.50,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'GOTV Jolli',
                'code' => 'gotv-jolli',
                'price' => 3300,
                'selling_price' => 3399,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'GOTV Max',
                'code' => 'gotv-max',
                'price' => 4850,
                'selling_price' => 4995.50,
                'validity' => '1 month',
                'is_active' => true,
            ],
        ];

        foreach ($gotvPlans as $plan) {
            CablePlan::create(array_merge($plan, ['cable_provider_id' => $gotv->id]));
        }

        // Startimes
        $startimes = CableProvider::create([
            'name' => 'Startimes',
            'code' => 'startimes',
            'logo' => 'cable/startimes.png',
            'is_active' => true,
        ]);

        // Startimes Plans
        $startimesPlans = [
            [
                'name' => 'Startimes Nova',
                'code' => 'startimes-nova',
                'price' => 900,
                'selling_price' => 927,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'Startimes Basic',
                'code' => 'startimes-basic',
                'price' => 1850,
                'selling_price' => 1905.50,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'Startimes Smart',
                'code' => 'startimes-smart',
                'price' => 2600,
                'selling_price' => 2678,
                'validity' => '1 month',
                'is_active' => true,
            ],
            [
                'name' => 'Startimes Super',
                'code' => 'startimes-super',
                'price' => 4900,
                'selling_price' => 5047,
                'validity' => '1 month',
                'is_active' => true,
            ],
        ];

        foreach ($startimesPlans as $plan) {
            CablePlan::create(array_merge($plan, ['cable_provider_id' => $startimes->id]));
        }
    }
}