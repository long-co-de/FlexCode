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
        // First, generate unique tokens for all existing empty card_token entries
        \DB::table('user_cards')
            ->where('card_token', '')
            ->orWhereNull('card_token')
            ->get()
            ->each(function ($card) {
                $uniqueToken = hash('sha256', $card->user_id . '|' . ($card->authorization_code ?? '') . '|' . $card->id);
                \DB::table('user_cards')
                    ->where('id', $card->id)
                    ->update(['card_token' => $uniqueToken]);
            });

        Schema::table('user_cards', function (Blueprint $table) {
            // Drop the old unique constraint
            $table->dropUnique(['card_token']);

            // Re-add as nullable with unique constraint (unique indexes in MySQL ignore NULL values)
            $table->string('card_token')->nullable()->change();
            $table->unique('card_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_cards', function (Blueprint $table) {
            $table->dropUnique(['card_token']);
            $table->string('card_token')->change();
            $table->unique('card_token');
        });
    }
};
