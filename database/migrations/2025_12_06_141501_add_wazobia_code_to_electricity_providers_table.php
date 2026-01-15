<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('electricity_providers', function (Blueprint $table) {
            $table->string('wazobia_code')->nullable()->after('code')->unique()->comment('Wazobia company code');
        });
    }

    public function down(): void
    {
        Schema::table('electricity_providers', function (Blueprint $table) {
            $table->dropColumn('wazobia_code');
        });
    }
};
