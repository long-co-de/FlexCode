<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Beneficiary extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'phone_number',
        'service_type', // airtime, data, cable, electricity, bank_transfer
        'network_id',
        'is_favorite',
        'meta_data',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'meta_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function network()
    {
        return $this->belongsTo(Network::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}