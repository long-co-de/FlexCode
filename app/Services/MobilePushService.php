<?php

namespace App\Services;

use App\Models\MobileDevice;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MobilePushService
{
    public function sendToUser(User $user, array $payload): void
    {
        $devices = $user->mobileDevices()->where('is_active', true)->get();

        foreach ($devices as $device) {
            $this->sendToDevice($device, $payload);
        }
    }

    public function sendToDevice(MobileDevice $device, array $payload): void
    {
        $message = [
            'to' => $device->expo_push_token,
            'sound' => 'default',
            'title' => $payload['title'] ?? config('app.name'),
            'body' => $payload['body'] ?? '',
            'data' => $payload['data'] ?? [],
        ];

        $endpoint = config('services.expo.push_url', 'https://exp.host/--/api/v2/push/send');
        $accessToken = config('services.expo.access_token');

        try {
            $request = Http::acceptJson();

            if ($accessToken) {
                $request = $request->withToken($accessToken);
            }

            $response = $request->post($endpoint, $message);

            if (! $response->successful()) {
                Log::warning('Expo push request failed', [
                    'device_id' => $device->id,
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Expo push dispatch failed', [
                'device_id' => $device->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
