<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Setting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add payment charges settings
        Setting::set('virtual_bank_deposit_charge', '0', 'payment', true);
        Setting::set('card_payment_charge', '0', 'payment', true);
        Setting::set('online_payment_charge', '0', 'payment', true);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove payment charges settings
        $settings = ['virtual_bank_deposit_charge', 'card_payment_charge', 'online_payment_charge'];
        foreach ($settings as $key) {
            Setting::where('key', $key)->delete();
        }
    }
};