<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BorrowSetting extends Model
{
    protected $fillable = [
        'service_type',
        'min_amount',
        'max_amount',
        'first_time_min_amount',
        'first_time_credit_limit',
        'base_interest_rate',
        'good_credit_interest_rate',
        'due_days',
        'is_active',
    ];

    protected $casts = [
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'first_time_min_amount' => 'decimal:2',
        'first_time_credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public static function getByServiceType($serviceType)
    {
        return static::where('service_type', $serviceType)->first();
    }

    public function isWithinLimit($amount)
    {
        return $amount >= $this->min_amount && $amount <= $this->max_amount;
    }
}
