<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use App\Models\SystemProfit;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * AtomicController - Base controller for atomic transaction processing
 * 
 * Provides methods for:
 * - Database transaction locking
 * - Request deduplication
 * - Atomic balance operations
 * - Race condition prevention
 */
abstract class AtomicController extends Controller
{
    /**
     * Process transaction atomically with row locking.
     * 
     * Prevents race conditions by:
     * 1. Using cache locks for concurrent request prevention
     * 2. Using database row locks (FOR UPDATE) for atomicity
     * 3. Ensuring balance checks happen within the locked transaction
     * 4. Rolling back on any error
     *
     * @param int $userId
     * @param float $amount
     * @param callable $transactionCallback
     * @param int $lockTimeout (seconds)
     * @return mixed
     * @throws \Exception
     */
    protected function processAtomicTransaction($userId, $amount, callable $transactionCallback, $lockTimeout = 10)
    {
        // **FIX 1: Use cache lock to prevent concurrent requests for same user**
        // This prevents multiple simultaneous transactions for the same user
        $lockKey = 'user_transaction_lock:' . $userId;
        $lock = Cache::lock($lockKey, $lockTimeout);
        
        if (!$lock->get()) {
            throw new \Exception('Another transaction is currently in progress for your account. Please wait and try again.');
        }
        
        DB::beginTransaction();
        
        try {
            // **FIX 2: Lock user row with FOR UPDATE to prevent concurrent reads**
            // This ensures no other transaction can read/modify this user's balance
            $user = User::where('id', $userId)
                ->lockForUpdate()
                ->firstOrFail();
            
            // **FIX 3: Verify balance WITHIN the locked transaction**
            // This must happen AFTER acquiring the lock to ensure atomicity
            if ($amount > 0 && $user->wallet_balance < $amount) {
                throw new \Exception('Insufficient wallet balance. Available: ₦' . number_format($user->wallet_balance, 2));
            }
            
            // **FIX 4: Verify balance won't go negative (additional check)**
            if (($user->wallet_balance - $amount) < 0) {
                throw new \Exception('Transaction would result in negative balance.');
            }
            
            // **FIX 5: Execute the transaction callback with the locked user**
            $result = $transactionCallback($user);
            
            // **FIX 6: Commit only if callback succeeds**
            DB::commit();
            
            return $result;
            
        } catch (\Exception $e) {
            // **FIX 7: Rollback on any error to ensure consistency**
            DB::rollBack();
            throw $e;
            
        } finally {
            // **FIX 8: Always release the lock, even if transaction fails**
            $lock->release();
        }
    }
    
    /**
     * Generate unique request ID for deduplication.
     * 
     * Creates a cryptographically random request ID that uniquely identifies
     * a transaction attempt. Used to prevent replay attacks and double submissions.
     *
     * @return string Format: REQ-{timestamp}-{random}-{userId}
     */
    protected function generateRequestId($userId = null)
    {
        $userId = $userId ?? auth('web')->id();
        return 'REQ-' . time() . '-' . Str::random(16) . '-' . $userId;
    }
    
    /**
     * Check if request is a duplicate (already processed).
     * 
     * Prevents the same request from being processed twice by storing
     * a cache entry. Particularly useful for:
     * - Page refresh after submission
     * - Double-click attacks
     * - Accidental resubmission
     *
     * @param string $requestId Unique request identifier
     * @param int $userId User who made the request
     * @param string $type Transaction type (e.g., 'wallet_transfer', 'data_purchase')
     * @param int $ttl Cache TTL in seconds (default: 5 minutes)
     * @return bool True if this is a duplicate request
     */
    protected function isDuplicateRequest($requestId, $userId, $type, $ttl = 300)
    {
        // Create cache key from request components
        $cacheKey = "duplicate_check:{$userId}:{$type}:{$requestId}";
        
        // Check if request was already processed
        if (Cache::has($cacheKey)) {
            return true;
        }
        
        // Mark request as processed for the TTL period
        // TTL prevents legitimate retries but catches accidental duplicates
        Cache::put($cacheKey, [
            'processed_at' => now(),
            'user_id' => $userId,
            'type' => $type,
        ], $ttl);
        
        return false;
    }
    
    /**
     * Safely deduct amount from user's wallet with proper error handling.
     *
     * @param User $user (must be locked via lockForUpdate())
     * @param float $amount
     * @param string $reason
     * @return bool
     * @throws \Exception
     */
    protected function deductWallet($user, $amount, $reason = 'Transaction')
    {
        if ($user->wallet_balance < $amount) {
            throw new \Exception('Insufficient wallet balance for ' . $reason);
        }
        
        // Deduct from wallet
        $user->wallet_balance = $user->wallet_balance - $amount;
        $user->save();
        
        return true;
    }
    
    /**
     * Safely credit amount to user's wallet with proper validation.
     *
     * @param User $user (must be locked via lockForUpdate())
     * @param float $amount
     * @param string $reason
     * @param float|null $maxLimit Maximum wallet balance allowed
     * @return bool
     * @throws \Exception
     */
    protected function creditWallet($user, $amount, $reason = 'Credit', $maxLimit = null)
    {
        if ($maxLimit === null) {
            $maxLimit = (float) \App\Models\Setting::get('max_wallet_balance', 1000000);
        }
        
        $newBalance = $user->wallet_balance + $amount;
        
        if ($newBalance > $maxLimit) {
            throw new \Exception('Wallet balance would exceed maximum limit of ₦' . number_format($maxLimit, 2));
        }
        
        $user->wallet_balance = $newBalance;
        $user->save();
        
        return true;
    }

    /**
     * Safely refund amount to user's wallet with row locking.
     * 
     * @param int $userId
     * @param float $amount
     * @param string $reason
     * @return bool
     */
    protected function refundWallet($userId, $amount, $reason = 'Refund')
    {
        try {
            DB::beginTransaction();
            
            $user = User::where('id', $userId)
                ->lockForUpdate()
                ->firstOrFail();
                
            $user->wallet_balance += $amount;
            $user->save();
            
            DB::commit();
            
            Log::info("Wallet refund successful", [
                'user_id' => $userId,
                'amount' => $amount,
                'reason' => $reason,
                'new_balance' => $user->wallet_balance
            ]);
            
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Wallet refund failed", [
                'user_id' => $userId,
                'amount' => $amount,
                'reason' => $reason,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Mark a transaction as failed and refund the user.
     * 
     * @param \App\Models\Transaction $transaction
     * @param int $userId
     * @param float $amount
     * @param mixed $errorResponse
     * @return void
     */
    protected function failAndRefund($transaction, $userId, $amount, $errorResponse)
    {
        try {
            DB::beginTransaction();
            
            $user = User::where('id', $userId)
                ->lockForUpdate()
                ->firstOrFail();
                
            $user->wallet_balance += $amount;
            $user->save();
            
            $transaction->status = 'failed';
            $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                'error_response' => $errorResponse,
                'refunded_at' => now(),
            ]);
            $transaction->save();
            
            DB::commit();
            
            Log::info("Transaction failed and refunded", [
                'transaction_id' => $transaction->id,
                'user_id' => $userId,
                'amount' => $amount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Fail and refund operation failed", [
                'transaction_id' => $transaction->id,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Check if user is rate-limited for transaction type.
     *
     * @param int $userId
     * @param string $type
     * @param int $maxAttempts
     * @param int $decaySeconds
     * @return bool True if user is rate-limited
     */
    protected function isRateLimited($userId, $type, $maxAttempts = 5, $decaySeconds = 60)
    {
        $key = "rate_limit:{$userId}:{$type}";
        $attempts = Cache::get($key, 0);
        
        if ($attempts >= $maxAttempts) {
            return true;
        }
        
        Cache::put($key, $attempts + 1, $decaySeconds);
        return false;
    }
    
    /**
     * Log transaction for audit trail.
     *
     * @param int $userId
     * @param string $type
     * @param float $amount
     * @param string $requestId
     * @param array $metadata
     * @return void
     */
    protected function logAtomicTransaction($userId, $type, $amount, $requestId, $metadata = [])
    {
        Log::channel('transactions')->info("Atomic Transaction Processed", [
            'user_id' => $userId,
            'type' => $type,
            'amount' => $amount,
            'request_id' => $requestId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => now(),
            'metadata' => $metadata,
        ]);
    }
    
    /**
     * Get remaining transaction limit for user.
     *
     * @param int $userId
     * @param string $type
     * @param int $maxAttempts
     * @param int $decaySeconds
     * @return int
     */
    protected function getRemainingAttempts($userId, $type, $maxAttempts = 5, $decaySeconds = 60)
    {
        $key = "rate_limit:{$userId}:{$type}";
        $attempts = Cache::get($key, 0);
        return max(0, $maxAttempts - $attempts);
    }

    /**
     * Calculate default profit margin based on settings.
     *
     * @param float $amount
     * @param string|null $type
     * @return float
     */
    protected function calculateProfitMargin($amount, $type = null)
    {
        $settingKey = $type ? "{$type}_profit_percentage" : "profit_percentage";
        $percentage = \App\Models\Setting::where('key', $settingKey)->value('value') ?? 5;
        
        return ($amount * $percentage) / 100;
    }

    /**
     * Record system profit to the system_profits table.
     * 
     * @param \App\Models\Transaction $transaction
     * @param float $profitAmount
     * @param string $source
     * @param float|null $percentage
     * @param string|null $description
     * @return \App\Models\SystemProfit|null
     */
    protected function recordSystemProfit($transaction, $profitAmount, $source, $percentage = null, $description = null)
    {
        try {
            if ($profitAmount <= 0) return null;

            return SystemProfit::create([
                'user_id' => $transaction->user_id,
                'transaction_id' => $transaction->id,
                'profit_source' => $source,
                'amount' => $transaction->amount,
                'profit_percentage' => $percentage ?? ($transaction->amount > 0 ? ($profitAmount / $transaction->amount) * 100 : 0),
                'profit_amount' => $profitAmount,
                'status' => 'recorded',
                'description' => $description ?? "Profit from {$source} transaction: {$transaction->reference}",
                'meta_data' => [
                    'reference' => $transaction->reference,
                    'type' => $transaction->type,
                    'recipient' => $transaction->recipient,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record system profit", [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
