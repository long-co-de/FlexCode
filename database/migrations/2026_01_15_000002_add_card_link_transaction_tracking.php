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
        Schema::table('transactions', function (Blueprint $table) {
            // Add column to track if transaction was triggered by card linking
            $table->boolean('is_card_link_transaction')->default(false)->after('type');
            // Add foreign key to user_cards for transaction reference
            // $table->foreignId('card_id')->nullable()->constrained('user_cards')->onDelete('set null')->after('is_card_link_transaction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'is_card_link_transaction')) {
                $table->dropColumn('is_card_link_transaction');
            }

            if (Schema::hasColumn('transactions', 'card_id')) {
                $table->dropColumn('card_id');
            }
        });
    }
};
