<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AirtimeToCash extends Model
{
    protected $table = 'airtime_to_cash';
    
    protected $fillable = [
        'user_id',
        'reference',
        'network',
        'phone_number',
        'amount',
        'fee',
        'amount_to_receive',
        'status',
        'admin_note',
        'user_note',
        'meta_data',
    ];
    
    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'amount_to_receive' => 'decimal:2',
        'meta_data' => 'array',
    ];
    
    /**
     * Get the user that owns the airtime to cash request.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Get the transaction associated with this airtime to cash request.
     */
    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'reference', 'reference');
    }
}
