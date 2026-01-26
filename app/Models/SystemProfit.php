<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemProfit extends Model
{
    protected $fillable = [
        'user_id',
        'transaction_id',
        'wallet_funding_id',
        'profit_source',
        'amount',
        'profit_percentage',
        'profit_amount',
        'status',
        'description',
        'meta_data',
    ];

    protected $casts = [
        'meta_data' => 'array',
        'amount' => 'decimal:2',
        'profit_percentage' => 'decimal:2',
        'profit_amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function walletFunding()
    {
        return $this->belongsTo(WalletFunding::class);
    }
}
