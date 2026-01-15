<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanTypeProfit extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_type',
        'profit_percentage',
        'is_active',
    ];

    /**
     * Get all data plans with this plan type
     */
    public function dataPlans()
    {
        return $this->hasMany(DataPlan::class, 'plan_type', 'plan_type');
    }
}