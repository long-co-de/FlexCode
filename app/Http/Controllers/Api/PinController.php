<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class PinController extends Controller
{
    /**
     * Set up a new PIN.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function setup(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ]);

        $user = Auth::user();
        
        // Check if user already has a PIN
        if ($user->pin) {
            return response()->json([
                'message' => 'PIN is already set. Use the change PIN endpoint to update it.',
            ], 400);
        }

        $user->pin = Hash::make($request->pin);
        $user->pin_verified = true;
        $user->save();

        return response()->json([
            'message' => 'PIN set up successfully.',
        ]);
    }

    /**
     * Verify the user's PIN.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verify(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
        ]);

        $user = Auth::user();

        if (!$user->pin) {
            return response()->json([
                'message' => 'PIN not set. Please set up your PIN first.',
                'error_code' => 'PIN_NOT_SET'
            ], 400);
        }

        if (!Hash::check($request->pin, $user->pin)) {
            return response()->json([
                'message' => 'The provided PIN is incorrect.',
                'error_code' => 'INVALID_PIN'
            ], 400);
        }

        return response()->json([
            'message' => 'PIN verified successfully.',
        ]);
    }

    /**
     * Change the user's PIN.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function change(Request $request)
    {
        $request->validate([
            'current_pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/', 'different:current_pin'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ]);

        $user = Auth::user();

        if (!$user->pin) {
            return response()->json([
                'message' => 'PIN not set. Please set up your PIN first.',
                'error_code' => 'PIN_NOT_SET'
            ], 400);
        }

        if (!Hash::check($request->current_pin, $user->pin)) {
            return response()->json([
                'message' => 'The provided current PIN is incorrect.',
                'error_code' => 'INVALID_CURRENT_PIN'
            ], 400);
        }

        $user->pin = Hash::make($request->pin);
        $user->save();

        return response()->json([
            'message' => 'PIN changed successfully.',
        ]);
    }
    
    /**
     * Reset the user's PIN using their account password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
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
            return response()->json([
                'message' => 'The provided password is incorrect.',
                'error_code' => 'INVALID_PASSWORD'
            ], 400);
        }

        // Update the PIN
        $user->pin = Hash::make($request->pin);
        $user->save();

        // Set session variable to indicate PIN is verified for this session
        session(['pin_verified' => true]);

        return response()->json([
            'message' => 'PIN reset successfully.',
        ]);
    }
}