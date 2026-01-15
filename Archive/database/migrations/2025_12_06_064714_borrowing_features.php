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
        // File: 2024_01_01_create_borrowing_eligibility_table.php
        Schema::create('borrowing_eligibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('eligibility_status')->default('pending'); // pending, eligible, not_eligible
            $table->decimal('credit_limit', 10, 2)->default(0);
            $table->decimal('available_credit', 10, 2)->default(0);
            $table->integer('credit_score')->default(0);
            $table->json('eligibility_criteria')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('last_eligibility_check')->nullable();
            $table->timestamps();
        });

        // File: 2024_01_02_create_user_cards_table.php
        Schema::create('user_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('card_type'); // visa, mastercard, verve
            $table->string('last_four');
            $table->string('authorization_code');
            $table->string('email');
            $table->string('bank');
            $table->string('bin')->nullable();
            $table->string('card_token')->unique();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // File: 2024_01_03_create_borrowings_table.php
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reference')->unique();
            $table->string('type'); // airtime, data, cable, electricity
            $table->decimal('amount', 10, 2);
            $table->decimal('interest_rate', 5, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->string('service_details'); // phone, meter number, etc
            $table->json('transaction_details'); // original transaction metadata
            $table->date('due_date');
            $table->string('status')->default('active'); // active, paid, overdue, failed
            $table->boolean('auto_deduction_enabled')->default(true);
            $table->integer('retry_count')->default(0);
            $table->timestamp('last_retry_at')->nullable();
            $table->timestamp('repaid_at')->nullable();
            $table->text('payment_note')->nullable();
            $table->timestamps();
        });

        // File: 2024_01_04_create_borrowing_repayments_table.php
        Schema::create('borrowing_repayments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrowing_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reference')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('card'); // card, wallet, bank_transfer
            $table->string('status')->default('pending'); // pending, success, failed
            $table->string('payment_gateway_response')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrowing_repayments');
        Schema::dropIfExists('borrowings');
        Schema::dropIfExists('user_cards');
        Schema::dropIfExists('borrowing_eligibility');
    }
};
