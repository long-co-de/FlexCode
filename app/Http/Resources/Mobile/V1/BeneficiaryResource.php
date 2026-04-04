<?php

namespace App\Http\Resources\Mobile\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BeneficiaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone_number' => $this->phone_number,
            'service_type' => $this->service_type,
            'is_favorite' => (bool) $this->is_favorite,
            'network' => $this->whenLoaded('network', fn () => [
                'id' => $this->network?->id,
                'name' => $this->network?->name,
                'code' => $this->network?->code,
            ]),
            'meta_data' => $this->meta_data ?? [],
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
