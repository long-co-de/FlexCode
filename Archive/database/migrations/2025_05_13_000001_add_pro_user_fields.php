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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_pro')->default(false)->after('role');
            $table->timestamp('pro_expires_at')->nullable()->after('is_pro');
        });

        Schema::create('promo_banners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('image_path');
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add profit margin settings for pro users
        Setting::set('pro_upgrade_fee', '5000', 'pro_user', true);  // ₦5000 for pro upgrade
        Setting::set('pro_duration_months', '1', 'pro_user', true); // 1 month duration
        Setting::set('airtime_profit_percentage', '2', 'pro_user', true); // 2% for airtime
        Setting::set('data_profit_percentage', '5', 'pro_user', true);    // Default 5% for data
        Setting::set('cable_profit_percentage', '3', 'pro_user', true);   // Default 3% for cable
        Setting::set('electricity_profit_percentage', '2', 'pro_user', true); // Default 2% for electricity
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_pro', 'pro_expires_at']);
        });

        Schema::dropIfExists('promo_banners');

        // Remove pro user settings
        $settings = [
            'pro_upgrade_fee',
            'pro_duration_months',
            'airtime_profit_percentage',
            'data_profit_percentage',
            'cable_profit_percentage',
            'electricity_profit_percentage'
        ];
        foreach ($settings as $key) {
            Setting::where('key', $key)->delete();
        }
    }
};
