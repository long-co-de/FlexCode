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
        Schema::table('data_plans', function (Blueprint $table) {
            $table->string('plan_type')->nullable()->after('code');
            $table->string('dataplan_id')->nullable()->after('plan_type');
            $table->json('api_response')->nullable()->after('is_active');
            $table->timestamp('last_api_update')->nullable()->after('api_response');
        });

        // Create a new table for plan type profit percentages
        Schema::create('plan_type_profits', function (Blueprint $table) {
            $table->id();
            $table->string('plan_type');
            $table->decimal('profit_percentage', 5, 2)->default(5.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Make plan_type unique
            $table->unique('plan_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_plans', function (Blueprint $table) {
            $table->dropColumn('plan_type');
            $table->dropColumn('dataplan_id');
            $table->dropColumn('api_response');
            $table->dropColumn('last_api_update');
        });

        Schema::dropIfExists('plan_type_profits');
    }
};