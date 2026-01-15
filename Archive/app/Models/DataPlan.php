<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Setting;
use Exception;

class DataPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'network_id',
        'name',
        'code',
        'plan_type',
        'dataplan_id',
        'price',
        'selling_price',
        'validity',
        'data_amount',
        'is_active',
        'api_response',
        'last_api_update',
    ];

    protected $casts = [
        'api_response' => 'array',
        'last_api_update' => 'datetime',
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'selling_price' => 'decimal:2'
    ];

    public function network()
    {
        return $this->belongsTo(Network::class);
    }

    /**
     * Get the plan type profit percentage for this data plan
     */
    public function planTypeProfit()
    {
        return $this->belongsTo(PlanTypeProfit::class, 'plan_type', 'plan_type');
    }

    /**
     * Calculate the selling price based on profit percentages
     * Priority:
     * 1. Network-specific data profit percentage
     * 2. Plan type profit percentage
     * 3. System default profit percentage
     *
     * @return float
     */
    public function calculateSellingPrice()
    {
        // First check network-specific percentage
        $profitPercentage = $this->network?->data_profit_percentage;

        // If no network-specific percentage, try plan type
        if ($profitPercentage === null) {
            $profitPercentage = $this->planTypeProfit?->profit_percentage;
        }

        // If still no percentage, use system default
        if ($profitPercentage === null) {
            $profitPercentage = Setting::where('key', 'data_profit_percentage')->value('value') ?? 5;
        }

        $profitAmount = ($this->price * $profitPercentage) / 100;
        $sellingPrice = $this->price + $profitAmount;

        return round($sellingPrice, 2);
    }

    /**
     * Update the selling price based on the current profit percentages
     *
     * @return void
     * @throws Exception If saving fails
     */
    public function updateSellingPrice()
    {
        try {
            $this->selling_price = $this->calculateSellingPrice();
            $this->save();
        } catch (Exception $e) {
            throw new Exception("Failed to update selling price: " . $e->getMessage());
        }
    }
}
