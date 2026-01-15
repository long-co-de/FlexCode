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
        Schema::create('borrow_settings', function (Blueprint $table) {
            $table->id();
            $table->string('service_type'); // airtime, data, electricity, cable
            $table->decimal('min_amount', 10, 2);
            $table->decimal('max_amount', 10, 2);
            $table->integer('base_interest_rate')->default(5); // Percentage
            $table->integer('good_credit_interest_rate')->default(3); // For score >= 80
            $table->integer('due_days')->default(30); // Repayment period in days
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['service_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrow_settings');
    }
};
