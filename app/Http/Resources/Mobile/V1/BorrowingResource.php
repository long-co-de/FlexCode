<?php

namespace App\Http\Resources\Mobile\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'interest_rate' => (float) $this->interest_rate,
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status,
            'service_details' => is_array($this->service_details) ? $this->service_details : (json_decode($this->service_details ?? '[]', true) ?: []),
            'transaction_details' => $this->transaction_details ?? [],
            'due_date' => optional($this->due_date)?->toDateString(),
            'repaid_at' => optional($this->repaid_at)?->toIso8601String(),
            'payment_note' => $this->payment_note,
            'repayments' => BorrowingRepaymentResource::collection($this->whenLoaded('repayments')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
