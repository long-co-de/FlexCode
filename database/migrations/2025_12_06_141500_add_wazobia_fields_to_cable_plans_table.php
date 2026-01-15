<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cable_plans', function (Blueprint $table) {
            // Only add columns if they don't already exist
            if (!Schema::hasColumn('cable_plans', 'product_code')) {
                $table->string('product_code')->nullable()->after('code')->comment('Wazobia product code');
            }
            if (!Schema::hasColumn('cable_plans', 'wazobia_price')) {
                $table->decimal('wazobia_price', 12, 2)->nullable()->after('selling_price')->comment('Original price from Wazobia API');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cable_plans', function (Blueprint $table) {
            $table->dropColumn(['product_code', 'wazobia_price']);
        });
    }
};
