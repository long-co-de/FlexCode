<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Add composite index for duplicate transfer detection (numeric columns only)
            // This helps quickly identify if a similar transfer was created recently
            if (!Schema::hasIndex('transactions', 'transfer_duplicate_check')) {
                $table->index(['user_id', 'amount', 'created_at'], 'transfer_duplicate_check');
            }

            // Add index for wallet transfer queries
            if (!Schema::hasIndex('transactions', 'wallet_transfer_index')) {
                $table->index(['user_id', 'created_at'], 'wallet_transfer_index');
            }

            // Add index for transaction type queries (use column prefix for VARCHAR)
            if (!Schema::hasIndex('transactions', 'transaction_type_index')) {
                DB::statement('ALTER TABLE transactions ADD INDEX transaction_type_index (type(50), status(50), created_at)');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            // Add index for phone number lookups (used in recipient verification)
            if (!Schema::hasIndex('users', 'phone_number_index')) {
                $table->index('phone_number', 'phone_number_index');
            }

            // Add composite index for wallet balance queries
            if (!Schema::hasIndex('users', 'wallet_balance_index')) {
                $table->index(['id', 'wallet_balance'], 'wallet_balance_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex('transfer_duplicate_check');
            $table->dropIndex('wallet_transfer_index');
            $table->dropIndex('transaction_type_index');
        });

        Schema::table('users', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex('phone_number_index');
            $table->dropIndex('wallet_balance_index');
        });
    }
};
