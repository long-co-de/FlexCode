<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AirtimeDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'network_id',
        'discount_percentage',
        'status',
    ];

    public function network()
    {
        return $this->belongsTo(Network::class);
    }
}