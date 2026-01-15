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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reference')->unique();
            $table->enum('type', ['airtime', 'data', 'cable', 'electricity', 'wallet_funding', 'wallet_transfer', 'commission']);
            $table->string('recipient')->nullable(); // Phone number, IUC number, Meter number, etc.
            $table->decimal('amount', 10, 2);
            $table->decimal('fee', 10, 2)->default(0.00);
            $table->enum('status', ['pending', 'successful', 'failed'])->default('pending');
            $table->text('description')->nullable();
            $table->json('meta_data')->nullable(); // Additional data like plan details, provider, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};