<?php

namespace App\Http\Resources\Mobile\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if ($this->resource === null) {
            return [];
        }

        return [
            'id' => $this->id,
            'card_type' => $this->card_type,
            'last_four' => $this->last_four,
            'bank' => $this->bank,
            'exp_month' => $this->exp_month,
            'exp_year' => $this->exp_year,
            'is_default' => (bool) $this->is_default,
            'is_active' => (bool) $this->is_active,
            'is_expired' => (bool) $this->is_expired,
            'expires_at' => optional($this->expires_at)?->toIso8601String(),
            'days_until_expiration' => $this->getDaysUntilExpiration(),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
