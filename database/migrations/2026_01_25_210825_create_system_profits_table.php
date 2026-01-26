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
        Schema::create('system_profits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('transaction_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('wallet_funding_id')->nullable()->constrained()->onDelete('set null');
            $table->string('profit_source');
            $table->decimal('amount', 20, 2);
            $table->decimal('profit_percentage', 10, 2);
            $table->decimal('profit_amount', 20, 2);
            $table->string('status')->default('recorded');
            $table->text('description')->nullable();
            $table->json('meta_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_profits');
    }
};
