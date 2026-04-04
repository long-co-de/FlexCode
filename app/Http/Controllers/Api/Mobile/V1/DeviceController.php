<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\MobileDeviceResource;
use App\Models\MobileDevice;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index(Request $request)
    {
        $devices = $request->user()->mobileDevices()->latest()->get();

        return $this->success(MobileDeviceResource::collection($devices), 'Mobile devices fetched successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => 'required|string',
            'platform' => 'required|in:ios,android,web',
            'device_name' => 'nullable|string|max:255',
            'app_version' => 'nullable|string|max:50',
        ]);

        $device = MobileDevice::updateOrCreate(
            ['expo_push_token' => $validated['expo_push_token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $validated['platform'],
                'device_name' => $validated['device_name'] ?? null,
                'app_version' => $validated['app_version'] ?? null,
                'last_seen_at' => now(),
                'is_active' => true,
            ]
        );

        return $this->success(new MobileDeviceResource($device), 'Device registered successfully.', 201);
    }

    public function destroy(Request $request, MobileDevice $device)
    {
        if ($device->user_id !== $request->user()->id) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED_DEVICE_ACCESS', 403);
        }

        $device->update(['is_active' => false]);

        return $this->success(null, 'Device deactivated successfully.');
    }
}
