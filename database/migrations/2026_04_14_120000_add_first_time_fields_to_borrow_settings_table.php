<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrow_settings', function (Blueprint $table) {
            $table->decimal('first_time_min_amount', 10, 2)->default(100)->after('max_amount');
            $table->decimal('first_time_credit_limit', 10, 2)->default(100)->after('first_time_min_amount');
        });

        DB::table('borrow_settings')
            ->where('service_type', 'electricity')
            ->update([
                'first_time_min_amount' => 5000,
                'first_time_credit_limit' => 5000,
            ]);
    }

    public function down(): void
    {
        Schema::table('borrow_settings', function (Blueprint $table) {
            $table->dropColumn(['first_time_min_amount', 'first_time_credit_limit']);
        });
    }
};

