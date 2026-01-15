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
            // Add timestamp for when card was linked
            $table->timestamp('card_linked_at')->nullable()->after('is_active');

            // Add unique constraint on authorization_code to prevent duplicate card registrations
            $table->unique('authorization_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_cards', function (Blueprint $table) {
            $table->dropTimestamps();
            $table->dropUnique(['authorization_code']);
        });
    }
};
