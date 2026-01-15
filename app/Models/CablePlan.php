<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CablePlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'cable_provider_id',
        'name',
        'code',
        'product_code',
        'price',
        'selling_price',
        'validity',
        'wazobia_price',
        'is_active',
    ];

    public function cableProvider()
    {
        return $this->belongsTo(CableProvider::class);
    }
}
