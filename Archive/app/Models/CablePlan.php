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
        'amount',
        'wazobia_price',
        'status',
    ];

    public function cableProvider()
    {
        return $this->belongsTo(CableProvider::class);
    }
}