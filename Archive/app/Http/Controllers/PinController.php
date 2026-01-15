<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class PinController extends Controller
{
    /**
     * Show the PIN setup form.
     *
     * @return \Inertia\Response
     */
    public function showSetup()
    {
        return Inertia::render('User/PinSetup');
    }

    /**
     * Handle the PIN setup request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function setup(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
        ]);

        $user = Auth::user();
        $user->pin = Hash::make($request->pin);
        $user->pin_verified = true;
        $user->save();

        // Set session variable to indicate PIN is verified for this session
        session(['pin_verified' => true]);

        // Redirect to the intended URL or dashboard if none is set
        return redirect()->intended(route('dashboard'));
    }

    /**
     * Handle the PIN verification request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verify(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
        ]);

        $user = Auth::user();

        if (!Hash::check($request->pin, $user->pin)) {
            // If this is an AJAX request or expects JSON, return a JSON response
            // if ($request->expectsJson() || $request->ajax()) {
            //     return response()->json([
            //         'message' => 'The provided PIN is incorrect.',
            //         'errors' => ['pin' => 'The provided PIN is incorrect.']
            //     ], 422);
            // }
            
            return back()->withErrors([
                'pin' => 'The provided PIN is incorrect.',
            ]);
        }

        // Set session variable to indicate PIN is verified for this session
        session(['pin_verified' => true]);

        // If this is an AJAX request or expects JSON, return a success response
        // if ($request->expectsJson() || $request->ajax()) {
        //     return response()->json([
        //         'message' => 'PIN verified successfully',
        //         'success' => true
        //     ]);
        // }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Show the PIN change form.
     *
     * @return \Inertia\Response
     */
    public function edit()
    {
        return Inertia::render('User/PinChange');
    }
    
    /**
     * Show the PIN reset form.
     *
     * @return \Inertia\Response
     */
    public function showReset()
    {
        return Inertia::render('User/PinReset');
    }

    /**
     * Handle the PIN change request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request)
    {
        $request->validate([
            'current_pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/', 'different:current_pin'],
            'pin_confirmation' => ['required', 'string', 'size:4', 'same:pin'],
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_pin, $user->pin)) {
            return back()->withErrors([
                'current_pin' => 'The provided PIN is incorrect.',
            ]);
        }

        $user->pin = Hash::make($request->pin);
        $user->save();

        return redirect()->route('profile.edit')->with('status', 'pin-updated');
    }
    
    /**
     * Reset the user's PIN using their account password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function resetWithPassword(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ]);

        $user = Auth::user();
        
        // Verify the user's password
        if (!Hash::check($request->password, $user->password)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'The provided password is incorrect.',
                    'error_code' => 'INVALID_PASSWORD'
                ], 400);
            }
            
            return back()->withErrors([
                'password' => 'The provided password is incorrect.',
            ]);
        }

        // Update the PIN
        $user->pin = Hash::make($request->pin);
        $user->save();

        // Set session variable to indicate PIN is verified for this session
        session(['pin_verified' => true]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'PIN reset successfully.',
            ]);
        }
        
        return redirect()->route('profile.edit')->with('status', 'pin-reset');
    }
}