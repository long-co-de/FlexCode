<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CheckActive
{
    /**
     * Handle an incoming request.
     * If the authenticated user's `is_active` is false, show a disabled account page.
     * Supports Inertia requests and plain web requests (Blade view fallback).
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        // If no user (guest) or active, continue
        if (!$user || $user->is_active) {
            return $next($request);
        }

        // If the request expects Inertia, render an Inertia page
        // if (class_exists(Inertia::class) && $request->header('X-Inertia')) {
            return Inertia::render('Account/Disabled', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ])->toResponse($request)->setStatusCode(403);
        // }

        // Otherwise return a simple Blade view (resources/views/account.disabled.blade.php)
        return response()->view('account.disabled', ['user' => $user], 403);
    }
}
