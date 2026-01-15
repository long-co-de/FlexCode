<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VerifyPin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        // Skip for admin users
        if ($user && $user->isAdmin()) {
            return $next($request);
        }

        // If PIN is not set, redirect to PIN setup page
        if (!$user || !$user->pin) {
            // Store the intended URL to redirect back after PIN setup
            session(['url.intended' => $request->url()]);
            return redirect()->route('pin.setup.show');
        }

        // If PIN is set but not verified for this session
        if (!session('pin_verified')) {
            // Store the intended URL to redirect back after PIN verification
            session(['url.intended' => $request->url()]);
            
            // return to_route('pin.veriy');
            // If this is an AJAX request or expects JSON, return a JSON response
            // if ($request->expectsJson() || $request->ajax()) {
            //     return response()->json([
            //         'message' => 'PIN verification required',
            //         'errors' => ['pin' => 'Please enter your PIN to continue.']
            //     ], 403);
            // }
            // PI-9650286642


            
            // Otherwise redirect to dashboard with a flash message
            return redirect()->route('dashboard')->withErrors(['pin_verification_required'=> true]);
        }

        return $next($request);
    }
}