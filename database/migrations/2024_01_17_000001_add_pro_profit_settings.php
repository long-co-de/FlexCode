<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->decimal('pro_data_profit_percentage', 5, 2)->default(2.0);
            $table->decimal('pro_cable_profit_percentage', 5, 2)->default(2.0);
            $table->decimal('pro_electricity_profit_percentage', 5, 2)->default(2.0);
            $table->json('pro_banner_templates')->nullable();
        });
    }

    public function down()
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'pro_data_profit_percentage',
                'pro_cable_profit_percentage',
                'pro_electricity_profit_percentage',
                'pro_banner_templates'
            ]);
        });
    }
};
