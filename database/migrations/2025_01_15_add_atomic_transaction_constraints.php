<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds critical database constraints to prevent data integrity issues:
     * 1. Check constraint to prevent negative wallet balance
     * 2. Unique indexes for request deduplication
     * 3. Indexes for atomic transaction lookups
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add check constraint to prevent negative wallet balance
            // This is the last line of defense against overspending
            try {
                if (DB::getDriverName() === 'mysql') {
                    // For MySQL 8.0+
                    DB::statement('ALTER TABLE users ADD CONSTRAINT chk_positive_wallet_balance CHECK (wallet_balance >= 0)');
                } elseif (DB::getDriverName() === 'pgsql') {
                    // For PostgreSQL
                    DB::statement('ALTER TABLE users ADD CONSTRAINT chk_positive_wallet_balance CHECK (wallet_balance >= 0::numeric)');
                }
            } catch (\Exception $e) {
                \Log::warning('Could not add wallet balance check constraint: ' . $e->getMessage());
            }

            // Add indexes for atomic transaction queries
            if (!Schema::hasIndex('users', 'wallet_status_index')) {
                $table->index(['id', 'wallet_balance', 'updated_at'], 'wallet_status_index');
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Add composite index for duplicate transaction detection (numeric columns only)
            // This speeds up the isDuplicateRequest() check
            if (!Schema::hasIndex('transactions', 'transfer_duplicate_check')) {
                $table->index(
                    ['user_id', 'amount', 'created_at'],
                    'transfer_duplicate_check'
                );
            }

            // Add index for rapid transaction detection
            if (!Schema::hasIndex('transactions', 'rapid_transaction_check')) {
                $table->index(['user_id', 'created_at'], 'rapid_transaction_check');
            }

            // Add index for status lookups (use column prefix for VARCHAR columns)
            if (!Schema::hasIndex('transactions', 'status_type_index')) {
                DB::statement('ALTER TABLE transactions ADD INDEX status_type_index (type(50), status(50), created_at)');
            }

            // Add index for wallet funding queries
            if (!Schema::hasIndex('transactions', 'wallet_funding_index')) {
                $table->index(
                    ['user_id', 'created_at'],
                    'wallet_funding_index'
                );
            }
        });

        Schema::table('users', function (Blueprint $table) {
            // Add index for phone number lookups (recipient verification)
            if (!Schema::hasIndex('users', 'phone_number_index')) {
                $table->index('phone_number', 'phone_number_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            try {
                DB::statement('ALTER TABLE users DROP CONSTRAINT chk_positive_wallet_balance');
            } catch (\Exception $e) {
                \Log::warning('Could not drop wallet balance check constraint: ' . $e->getMessage());
            }

            $table->dropIndexIfExists('wallet_status_index');
            $table->dropIndexIfExists('phone_number_index');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndexIfExists('transfer_duplicate_check');
            $table->dropIndexIfExists('rapid_transaction_check');
            $table->dropIndexIfExists('status_type_index');
            $table->dropIndexIfExists('wallet_funding_index');
            $table->dropIndexIfExists('recipient_index');
        });
    }
};
