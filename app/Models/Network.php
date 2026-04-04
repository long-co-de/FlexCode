<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Network extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'logo',
        'status',
        'data_profit_percentage'
    ];

    protected $casts = [
        'status' => 'boolean',
        'data_profit_percentage' => 'decimal:2'
    ];

    public function dataPlans()
    {
        return $this->hasMany(DataPlan::class);
    }

    public function airtimeDiscounts()
    {
        return $this->hasMany(AirtimeDiscount::class);
    }

    public function airtimeDiscount()
    {
        return $this->hasOne(AirtimeDiscount::class);
    }

    /**
     * Get the profit percentage for data plans
     * Falls back to system default if not set
     */
    public function getDataProfitPercentage()
    {
        if ($this->data_profit_percentage !== null) {
            return $this->data_profit_percentage;
        }

        return Setting::where('key', 'data_profit_percentage')->value('value') ?? 5;
    }
}
