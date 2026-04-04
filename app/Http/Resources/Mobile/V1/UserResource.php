<?php

namespace App\Http\Resources\Mobile\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone_number' => $this->phone_number,
            'role' => $this->role,
            'wallet_balance' => (float) $this->wallet_balance,
            'is_active' => (bool) $this->is_active,
            'has_pin' => ! is_null($this->pin),
            'email_verified_at' => optional($this->email_verified_at)?->toIso8601String(),
            'notification_preferences' => [
                'email_notifications' => (bool) $this->email_notifications,
                'transaction_notifications' => (bool) $this->transaction_notifications,
                'marketing_notifications' => (bool) $this->marketing_notifications,
                'system_notifications' => (bool) $this->system_notifications,
            ],
            'virtual_accounts' => array_values($this->virtual_account_details ?? []),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
