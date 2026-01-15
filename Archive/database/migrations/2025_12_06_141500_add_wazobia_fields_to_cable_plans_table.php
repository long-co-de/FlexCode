<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cable_plans', function (Blueprint $table) {
            $table->string('product_code')->nullable()->after('code')->comment('Wazobia product code');
            $table->decimal('wazobia_price', 12, 2)->nullable()->after('amount')->comment('Original price from Wazobia API');
        });
    }

    public function down(): void
    {
        Schema::table('cable_plans', function (Blueprint $table) {
            $table->dropColumn(['product_code', 'wazobia_price']);
        });
    }
};
