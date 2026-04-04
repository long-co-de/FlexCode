<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return $this->success(new UserResource($request->user()), 'Profile fetched successfully.');
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone_number' => 'required|string|max:20|unique:users,phone_number,' . $user->id,
        ]);

        $user->update($request->only('name', 'email', 'phone_number'));

        return $this->success(new UserResource($user->fresh()), 'Profile updated successfully.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return $this->error('The provided current password is incorrect.', 'INVALID_CURRENT_PASSWORD', 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return $this->success(null, 'Password updated successfully.');
    }

    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'email_notifications' => ['boolean'],
            'transaction_notifications' => ['boolean'],
            'marketing_notifications' => ['boolean'],
            'system_notifications' => ['boolean'],
        ]);

        $request->user()->update($validated);

        return $this->success(new UserResource($request->user()->fresh()), 'Notification preferences updated successfully.');
    }
}
