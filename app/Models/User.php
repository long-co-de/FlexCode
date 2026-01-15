<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_number',
        'role',
        'is_active',
        'wallet_balance',
        'total_referral_earnings',
        'pending_referral_earnings',
        'referral_code',
        'referred_by',
        'pin',
        'pin_verified',
        'api_key',
        'api_key_created_at',
        'api_key_enabled',
        'email_notifications',
        'transaction_notifications',
        'marketing_notifications',
        'system_notifications',
        'virtual_account_details',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'api_key',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'wallet_balance' => 'decimal:2',
        'total_referral_earnings' => 'decimal:2',
        'pending_referral_earnings' => 'decimal:2',
        'api_key_created_at' => 'datetime',
        'api_key_enabled' => 'boolean',
        'is_active' => 'boolean',
        'email_notifications' => 'boolean',
        'transaction_notifications' => 'boolean',
        'marketing_notifications' => 'boolean',
        'system_notifications' => 'boolean',
        'virtual_account_details' => 'array',
    ];

    /**
     * Check if the user is an admin.
     *
     * @return bool
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Check if the user is an agent.
     *
     * @return bool
     */
    public function isAgent()
    {
        return $this->role === 'agent';
    }

    /**
     * Get the transactions for the user.
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the wallet fundings for the user.
     */
    public function walletFundings()
    {
        return $this->hasMany(WalletFunding::class);
    }

    /**
     * Get the user who referred this user.
     */
    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    /**
     * Get the users referred by this user.
     */
    public function referrals()
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    /**
     * Generate a new API key for the user.
     *
     * @return string
     */
    public function generateApiKey()
    {
        $this->api_key = bin2hex(random_bytes(32));
        $this->api_key_created_at = now();
        $this->api_key_enabled = true;
        $this->save();

        return $this->api_key;
    }

    /**
     * Revoke the user's API key.
     *
     * @return void
     */
    public function revokeApiKey()
    {
        $this->api_key = null;
        $this->api_key_created_at = null;
        $this->api_key_enabled = false;
        $this->save();
    }

    /**
     * Toggle the API key status.
     *
     * @return bool
     */
    public function toggleApiKeyStatus()
    {
        if (!$this->api_key) {
            return false;
        }

        $this->api_key_enabled = !$this->api_key_enabled;
        $this->save();

        return $this->api_key_enabled;
    }

    /**
     * Check if the user has an active API key.
     *
     * @return bool
     */
    public function hasActiveApiKey()
    {
        return $this->api_key && $this->api_key_enabled;
    }

    /**
     * Get the conversations initiated by the user.
     */
    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Get the conversations assigned to the agent.
     */
    public function assignedConversations()
    {
        return $this->hasMany(Conversation::class, 'agent_id');
    }

    /**
     * Get the messages sent by the user.
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the messages sent by the agent.
     */
    public function agentMessages()
    {
        return $this->hasMany(Message::class, 'agent_id');
    }

    // Add to User.php model
/**
 * Get the user's borrowing eligibility.
 */
public function borrowingEligibility()
{
    return $this->hasOne(BorrowingEligibility::class);
}

/**
 * Get the user's saved cards.
 */
public function cards()
{
    return $this->hasMany(UserCard::class);
}

/**
 * Get the user's borrowings.
 */
public function borrowings()
{
    return $this->hasMany(Borrowing::class);
}

/**
 * Get the user's active borrowings.
 */
public function activeBorrowings()
{
    return $this->borrowings()->where('status', 'active');
}

/**
 * Get the user's overdue borrowings.
 */
public function overdueBorrowings()
{
    return $this->borrowings()->where('status', 'overdue');
}
}
