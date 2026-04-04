<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add total referral earnings column
            $table->decimal('total_referral_earnings', 10, 2)->default(0.00)->after('wallet_balance');
            // Add pending referral earnings (awaiting referree's first deposit)
            $table->decimal('pending_referral_earnings', 10, 2)->default(0.00)->after('total_referral_earnings');
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Add referral source tracking
            $table->foreignId('referral_user_id')->nullable()->constrained('users')->onDelete('set null')->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['total_referral_earnings', 'pending_referral_earnings']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'referral_user_id')) {
                $table->dropColumn('referral_user_id');
            }
        });
    }
};
