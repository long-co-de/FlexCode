<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    /**
     * Get the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        $userData = $user->toArray();

        // Add API key status information
        $userData['has_api_key'] = !is_null($user->api_key);
        $userData['api_key_enabled'] = $user->api_key_enabled;
        $userData['api_key_created_at'] = $user->api_key_created_at;

        return response()->json([
            'user' => $userData,
        ]);
    }

    /**
     * Update the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone_number' => 'required|string|max:20|unique:users,phone_number,' . $user->id,
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Update the authenticated user's password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The provided current password is incorrect.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }

    /**
     * Generate a new API key for the user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateApiKey(Request $request)
    {
        $user = $request->user();
        $apiKey = $user->generateApiKey();

        return response()->json([
            'message' => 'API key generated successfully',
            'api_key' => $apiKey,
            'api_key_created_at' => $user->api_key_created_at,
            'api_key_enabled' => $user->api_key_enabled,
        ]);
    }

    /**
     * Revoke the user's API key.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function revokeApiKey(Request $request)
    {
        $user = $request->user();

        if (!$user->api_key) {
            return response()->json([
                'message' => 'No API key found to revoke.',
            ], 400);
        }

        $user->revokeApiKey();

        return response()->json([
            'message' => 'API key revoked successfully',
        ]);
    }

    /**
     * Toggle the API key status (enable/disable).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleApiKeyStatus(Request $request)
    {
        $user = $request->user();

        if (!$user->api_key) {
            return response()->json([
                'message' => 'No API key found to toggle status.',
            ], 400);
        }

        $newStatus = $user->toggleApiKeyStatus();

        return response()->json([
            'message' => 'API key ' . ($newStatus ? 'enabled' : 'disabled') . ' successfully',
            'api_key_enabled' => $newStatus,
        ]);
    }

    /**
     * Verify a user by phone number.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyUser(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string',
        ]);

        $user = \App\Models\User::where('phone_number', $request->phone_number)->where(
            'id',
            '!=',
            auth('web')->id(),
        )->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        // Don't allow verifying yourself
        // if ($user->id === $request->user()->id) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'You cannot transfer to yourself',
        //     ], 400);
        // }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone_number' => $user->phone_number,
            ],
        ]);
    }
}
