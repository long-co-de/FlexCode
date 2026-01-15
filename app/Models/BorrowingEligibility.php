<?php
// File: BorrowingEligibility.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BorrowingEligibility extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'eligibility_status',
        'credit_limit',
        'available_credit',
        'credit_score',
        'eligibility_criteria',
        'rejection_reason',
        'last_eligibility_check',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'available_credit' => 'decimal:2',
        'eligibility_criteria' => 'array',
        'last_eligibility_check' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isEligible()
    {
        return $this->eligibility_status === 'eligible' && $this->available_credit > 0;
    }

    public function canBorrow($amount)
    {
        return $this->isEligible() && $this->available_credit >= $amount;
    }
}