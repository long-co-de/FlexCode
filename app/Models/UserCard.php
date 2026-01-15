<?php
// File: UserCard.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'card_type',
        'last_four',
        'authorization_code',
        'email',
        'bank',
        'bin',
        'exp_month',
        'exp_year',
        'expires_at',
        'card_token',
        'is_default',
        'is_active',
        'is_expired',
        'metadata',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'is_expired' => 'boolean',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Check if card is expired
     */
    public function isExpired(): bool
    {
        return $this->is_expired || ($this->expires_at && $this->expires_at->isPast());
    }

    /**
     * Check if card is expiring within 60 days (warning period)
     */
    public function isExpiringsoon(): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        $warningDate = now()->addDays(60);
        return $this->expires_at->isBefore($warningDate) && $this->expires_at->isFuture();
    }

    /**
     * Get days remaining until expiration
     */
    public function getDaysUntilExpiration(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }

        $days = now()->diffInDays($this->expires_at, false);
        return max(0, (int) $days);
    }

    /**
     * Mark card as expired
     */
    public function markAsExpired(): bool
    {
        return $this->update([
            'is_expired' => true,
            'is_active' => false,
        ]);
    }

    /**
     * Calculate expiration date from exp_month and exp_year
     */
    public function calculateExpireDate(): ?\DateTime
    {
        if (!$this->exp_month || !$this->exp_year) {
            return null;
        }

        try {
            // Parse expiration date - typically last day of the month
            $lastDay = \Carbon\Carbon::createFromFormat('m/y', $this->exp_month . '/' . $this->exp_year)
                ->endOfMonth();
            return $lastDay;
        } catch (\Exception $e) {
            return null;
        }
    }
}
