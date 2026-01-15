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
        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('phone_number')->nullable();
            $table->string('service_type'); // airtime, data, cable, electricity, bank_transfer
            $table->foreignId('network_id')->nullable()->constrained()->onDelete('set null');
            $table->boolean('is_favorite')->default(false);
            $table->json('meta_data')->nullable();
            $table->timestamps();
            
            // Add index for faster lookups
            $table->index(['user_id', 'service_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('beneficiaries');
    }
};