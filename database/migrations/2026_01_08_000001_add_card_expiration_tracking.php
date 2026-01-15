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
        Schema::table('user_cards', function (Blueprint $table) {
            // Add card expiration tracking fields
            $table->string('exp_month')->nullable()->after('bin');
            $table->string('exp_year')->nullable()->after('exp_month');
            $table->timestamp('expires_at')->nullable()->after('exp_year');
            $table->boolean('is_expired')->default(false)->after('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_cards', function (Blueprint $table) {
            $table->dropColumn(['exp_month', 'exp_year', 'expires_at', 'is_expired']);
        });
    }
};
