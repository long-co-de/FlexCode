<?php

namespace App\Http\Resources\Mobile\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $normalizedStatus = match ($this->status) {
            'success', 'successful' => 'successful',
            default => $this->status,
        };

        $normalizedType = match ($this->type) {
            'withdrawal' => 'wallet_withdrawal',
            'wallet_transfer' => 'wallet_transfer',
            default => $this->type,
        };

        $direction = null;
        if ($normalizedType === 'wallet_transfer') {
            $direction = isset($this->meta_data['sender_id']) ? 'incoming' : 'outgoing';
        }

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'type' => $normalizedType,
            'raw_type' => $this->type,
            'status' => $normalizedStatus,
            'raw_status' => $this->status,
            'direction' => $direction,
            'amount' => (float) $this->amount,
            'fee' => (float) ($this->fee ?? 0),
            'profit' => (float) ($this->profit ?? 0),
            'recipient' => $this->recipient,
            'description' => $this->description,
            'meta_data' => $this->meta_data ?? [],
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
