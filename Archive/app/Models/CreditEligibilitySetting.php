<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditEligibilitySetting extends Model
{
    protected $fillable = [
        'service_type',
        'min_credit_score',
        'credit_limit_90_plus',
        'credit_limit_80_89',
        'credit_limit_70_79',
        'credit_limit_60_69',
        'credit_limit_50_59',
        'credit_limit_40_49',
        'min_account_age_days',
        'min_transaction_count',
        'is_active',
    ];

    protected $casts = [
        'credit_limit_90_plus' => 'decimal:2',
        'credit_limit_80_89' => 'decimal:2',
        'credit_limit_70_79' => 'decimal:2',
        'credit_limit_60_69' => 'decimal:2',
        'credit_limit_50_59' => 'decimal:2',
        'credit_limit_40_49' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public static function getByServiceType($serviceType)
    {
        return static::where('service_type', $serviceType)->first();
    }

    public function getCreditLimit($creditScore)
    {
        if ($creditScore >= 90) {
            return $this->credit_limit_90_plus;
        } elseif ($creditScore >= 80) {
            return $this->credit_limit_80_89;
        } elseif ($creditScore >= 70) {
            return $this->credit_limit_70_79;
        } elseif ($creditScore >= 60) {
            return $this->credit_limit_60_69;
        } elseif ($creditScore >= 50) {
            return $this->credit_limit_50_59;
        } elseif ($creditScore >= 40) {
            return $this->credit_limit_40_49;
        }

        return 0;
    }

    public function isCreditScoreSufficient($creditScore)
    {
        return $creditScore >= $this->min_credit_score;
    }
}
