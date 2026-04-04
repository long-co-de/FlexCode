<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PinController extends Controller
{
    public function setup(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ]);

        $user = $request->user();

        if ($user->pin) {
            return $this->error('PIN is already set. Use the change endpoint to update it.', 'PIN_ALREADY_SET', 400);
        }

        $user->update([
            'pin' => Hash::make($request->pin),
            'pin_verified' => true,
        ]);

        return $this->success(null, 'PIN set up successfully.');
    }

    public function verify(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
        ]);

        $user = $request->user();

        if (! $user->pin) {
            return $this->error('PIN not set. Please set up your PIN first.', 'PIN_NOT_SET', 400);
        }

        if (! Hash::check($request->pin, $user->pin)) {
            return $this->error('The provided PIN is incorrect.', 'INVALID_PIN', 400);
        }

        return $this->success(null, 'PIN verified successfully.');
    }

    public function change(Request $request)
    {
        $request->validate([
            'current_pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/', 'different:current_pin'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ]);

        $user = $request->user();

        if (! $user->pin) {
            return $this->error('PIN not set. Please set up your PIN first.', 'PIN_NOT_SET', 400);
        }

        if (! Hash::check($request->current_pin, $user->pin)) {
            return $this->error('The provided current PIN is incorrect.', 'INVALID_CURRENT_PIN', 400);
        }

        $user->update([
            'pin' => Hash::make($request->pin),
        ]);

        return $this->success(null, 'PIN changed successfully.');
    }

    public function resetWithPassword(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]+$/'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            return $this->error('The provided password is incorrect.', 'INVALID_PASSWORD', 400);
        }

        $user->update([
            'pin' => Hash::make($request->pin),
        ]);

        return $this->success(null, 'PIN reset successfully.');
    }
}
