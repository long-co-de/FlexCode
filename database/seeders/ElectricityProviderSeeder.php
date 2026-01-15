<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ElectricityProvider;

class ElectricityProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $providers = [
            [
                'name' => 'Ikeja Electric',
                'code' => 'ikeja-electric',
                'logo' => 'electricity/ikeja.png',
                'is_active' => true,
            ],
            [
                'name' => 'Eko Electric',
                'code' => 'eko-electric',
                'logo' => 'electricity/eko.png',
                'is_active' => true,
            ],
            [
                'name' => 'Abuja Electric',
                'code' => 'abuja-electric',
                'logo' => 'electricity/abuja.png',
                'is_active' => true,
            ],
            [
                'name' => 'Kano Electric',
                'code' => 'kano-electric',
                'logo' => 'electricity/kano.png',
                'is_active' => true,
            ],
            [
                'name' => 'Enugu Electric',
                'code' => 'enugu-electric',
                'logo' => 'electricity/enugu.png',
                'is_active' => true,
            ],
            [
                'name' => 'Port Harcourt Electric',
                'code' => 'portharcourt-electric',
                'logo' => 'electricity/portharcourt.png',
                'is_active' => true,
            ],
            [
                'name' => 'Ibadan Electric',
                'code' => 'ibadan-electric',
                'logo' => 'electricity/ibadan.png',
                'is_active' => true,
            ],
            [
                'name' => 'Kaduna Electric',
                'code' => 'kaduna-electric',
                'logo' => 'electricity/kaduna.png',
                'is_active' => true,
            ],
            [
                'name' => 'Jos Electric',
                'code' => 'jos-electric',
                'logo' => 'electricity/jos.png',
                'is_active' => true,
            ],
            [
                'name' => 'Benin Electric',
                'code' => 'benin-electric',
                'logo' => 'electricity/benin.png',
                'is_active' => true,
            ],
        ];

        foreach ($providers as $provider) {
            ElectricityProvider::create($provider);
        }
    }
}