<?php

namespace App\Services;

use App\Models\UserCard;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CardLinkingService
{
    /**
     * Record a transaction when a card is linked
     *
     * @param UserCard $card
     * @return Transaction|null
     */
    public function recordCardLinkingTransaction(UserCard $card): ?Transaction
    {
        try {
            $transaction = DB::transaction(function () use ($card) {
                return Transaction::create([
                    'user_id' => $card->user_id,
                    'reference' => 'CARD-LINK-' . uniqid(),
                    'type' => 'card_linking',
                    'is_card_link_transaction' => true,
                    'amount' => 0,
                    'status' => 'successful',
                    'description' => "Card linking - {$card->card_type} ending in {$card->last_four}",
                    'meta_data' => [
                        'card_id' => $card->id,
                        'card_brand' => $card->card_type,
                        'last4' => $card->last_four,
                        'authorization_code' => $card->authorization_code,
                        'card_linked_at' => now(),
                    ],
                ]);
            });

            return $transaction;
        } catch (\Exception $e) {
            Log::error('Card linking transaction recording failed', [
                'card_id' => $card->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get card linking history for a user
     *
     * @param int $userId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getCardLinkingHistory(int $userId, int $limit = 10)
    {
        return Transaction::where('user_id', $userId)
            ->where('is_card_link_transaction', true)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get card linking statistics for a user
     *
     * @param int $userId
     * @return array
     */
    public function getCardLinkingStats(int $userId): array
    {
        $totalLinked = Transaction::where('user_id', $userId)
            ->where('is_card_link_transaction', true)
            ->count();

        $firstCardLinked = Transaction::where('user_id', $userId)
            ->where('is_card_link_transaction', true)
            ->oldest('created_at')
            ->first();

        $lastCardLinked = Transaction::where('user_id', $userId)
            ->where('is_card_link_transaction', true)
            ->latest('created_at')
            ->first();

        return [
            'total_cards_linked' => $totalLinked,
            'first_card_linked_at' => $firstCardLinked?->created_at,
            'last_card_linked_at' => $lastCardLinked?->created_at,
        ];
    }
}
