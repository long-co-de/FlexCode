<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_eligibility_settings', function (Blueprint $table) {
            $table->id();
            $table->string('service_type')->unique();
            $table->integer('min_credit_score')->default(50);
            $table->decimal('credit_limit_90_plus', 15, 2)->default(50000);
            $table->decimal('credit_limit_80_89', 15, 2)->default(25000);
            $table->decimal('credit_limit_70_79', 15, 2)->default(15000);
            $table->decimal('credit_limit_60_69', 15, 2)->default(10000);
            $table->decimal('credit_limit_50_59', 15, 2)->default(5000);
            $table->decimal('credit_limit_40_49', 15, 2)->default(2000);
            $table->integer('min_account_age_days')->default(7);
            $table->integer('min_transaction_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_eligibility_settings');
    }
};
