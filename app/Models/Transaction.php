<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reference',
        'type', // airtime, data, cable, electricity, wallet_funding
        'amount',
        'fee',
        'profit',
        'status', // pending, success, failed
        'recipient',
        'description',
        'meta_data', // JSON data for additional information
        'verified_by', // ID of the agent who verified the transaction
        'verified_at', // Timestamp when the transaction was verified
        'notes', // Notes added by the agent during verification
    ];

    protected $casts = [
        'meta_data' => 'array',
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the agent who verified the transaction.
     */
    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
