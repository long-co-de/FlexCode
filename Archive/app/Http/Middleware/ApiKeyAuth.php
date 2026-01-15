<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuth
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
        $apiKey = $request->header('X-API-KEY');
        
        if (!$apiKey) {
            return response()->json([
                'message' => 'API key is missing',
            ], 401);
        }
        
        $user = User::where('api_key', $apiKey)
            ->where('api_key_enabled', true)
            ->first();
        
        if (!$user) {
            return response()->json([
                'message' => 'Invalid or disabled API key',
            ], 401);
        }
        
        // Set the authenticated user for this request
        auth()->login($user);
        
        return $next($request);
    }
}