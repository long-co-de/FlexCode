<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiPin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Skip for admin users
        if ($user && $user->isAdmin()) {
            return $next($request);
        }

        // If PIN is not set, return error
        if (!$user || !$user->pin) {
            return response()->json([
                'message' => 'PIN not set. Please set up your PIN first.',
                'error_code' => 'PIN_NOT_SET'
            ], 403);
        }

        // Check if PIN is provided in the request
        $pin = $request->header('X-PIN');
        
        if (!$pin) {
            return response()->json([
                'message' => 'PIN is required for this operation.',
                'error_code' => 'PIN_REQUIRED'
            ], 403);
        }

        // Verify the PIN
        if (!Hash::check($pin, $user->pin)) {
            return response()->json([
                'message' => 'Invalid PIN provided.',
                'error_code' => 'INVALID_PIN'
            ], 403);
        }

        return $next($request);
    }
}