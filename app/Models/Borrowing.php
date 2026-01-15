<?php
// File: Borrowing.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Borrowing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reference',
        'type',
        'amount',
        'interest_rate',
        'total_amount',
        'service_details',
        'transaction_details',
        'due_date',
        'status',
        'auto_deduction_enabled',
        'retry_count',
        'last_retry_at',
        'repaid_at',
        'payment_note',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'transaction_details' => 'array',
        'due_date' => 'date',
        'auto_deduction_enabled' => 'boolean',
        'last_retry_at' => 'datetime',
        'repaid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function repayments()
    {
        return $this->hasMany(BorrowingRepayment::class);
    }

    public function isOverdue()
    {
        return $this->status === 'active' && now()->greaterThan($this->due_date);
    }

    public function markAsPaid()
    {
        $this->status = 'paid';
        $this->repaid_at = now();
        $this->save();
    }

    public function calculateInterest()
    {
        $interest = ($this->amount * $this->interest_rate) / 100;
        $this->total_amount = $this->amount + $interest;
        return $this->total_amount;
    }
}