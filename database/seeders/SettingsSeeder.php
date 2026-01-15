<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // General settings
        Setting::set('site_name', 'BorrowLite', 'general', true);
        Setting::set('site_description', 'Buy airtime, data, cable TV subscriptions, and pay electricity bills', 'general', true);
        Setting::set('contact_email', 'support@vtuapp.com', 'general', true);
        Setting::set('contact_phone', '+2348012345678', 'general', true);
        Setting::set('maintenance_mode', 'false', 'general', true);

        // API settings
        Setting::set('husmodata_api_key', 'your-api-key-here', 'api', false);
        Setting::set('husmodata_api_url', 'https://husmodataapi.com', 'api', true);
        
        // Datavendro settings
        Setting::set('datavendro_api_key', '8b0db02d232377ca7c7dd354e30b41a423f7201d', 'api', false);
        Setting::set('datavendro_api_url', 'https://datavendor.ng/api/', 'api', true);
        // VTPass settings
        Setting::set('vtpass_api_key', env('VTPASS_API_KEY', 'your-vtpass-api-key'), 'api', false);
        Setting::set('vtpass_secret_key', env('VTPASS_SECRET_KEY', 'your-vtpass-secret-key'), 'api', false);
        Setting::set('vtpass_api_url', env('VTPASS_API_URL', 'https://vtpass.com/api'), 'api', true);

        // Profit margins
        Setting::set('airtime_profit_percentage', '2', 'profit', true);
        Setting::set('data_profit_percentage', '5', 'profit', true);
        Setting::set('cable_profit_percentage', '3', 'profit', true);
        Setting::set('electricity_profit_percentage', '2', 'profit', true);

        // Referral system
        Setting::set('referral_bonus_percentage', '1', 'referral', true);
        Setting::set('min_withdrawal_amount', '1000', 'referral', true);
    }
}
