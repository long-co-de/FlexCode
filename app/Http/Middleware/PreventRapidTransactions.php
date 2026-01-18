<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * PreventRapidTransactions Middleware
 * 
 * Prevents users from making multiple transactions too quickly.
 * Helps prevent brute force attacks and accidental rapid submissions.
 * 
 * Usage:
 * - Route::middleware('rapid.transactions:wallet')->post('/wallet/transfer', ...)
 * - Route::middleware('rapid.transactions:data')->post('/data/purchase', ...)
 */
class PreventRapidTransactions
{
    /**
     * Handle the incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $type (wallet, data, airtime, etc.)
     * @param  int  $maxAttempts (default: 3)
     * @param  int  $decaySeconds (default: 60)
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $type = 'default', $maxAttempts = 3, $decaySeconds = 60)
    {
        $user = $request->user();
        
        // Skip middleware if user not authenticated
        if (!$user) {
            return $next($request);
        }
        
        // Build cache key for this user and transaction type
        $key = "rapid_transactions:{$user->id}:{$type}";
        
        // Get current attempt count
        $attempts = Cache::get($key, 0);
        
        // Check if user has exceeded max attempts
        if ($attempts >= $maxAttempts) {
            $remaining = Cache::get("{$key}:reset_at", null);
            
            return back()->with('error', "Too many {$type} requests. Please wait {$decaySeconds} seconds before trying again.")
                ->with('retry_after', $decaySeconds);   
            // return response()->json([
            //     'success' => false,
            //     'message' => "Too many {$type} requests. Please wait {$decaySeconds} seconds before trying again.",
            //     'retry_after' => $decaySeconds,
            // ], 429)
            // ->header('Retry-After', $decaySeconds);
        }
         
        // Increment attempt counter
        Cache::put($key, $attempts + 1, $decaySeconds);
        
        // Process the request
        $response = $next($request);
        
        // Reset counter on successful response (2xx status)
        if ($response->isSuccessful() || $response->getStatusCode() === 302) {
            Cache::forget($key);
        }
        
        return $response;
    }
}
