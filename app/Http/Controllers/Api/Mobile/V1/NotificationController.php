<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\NotificationResource;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($notifications, NotificationResource::collection($notifications), 'Notifications fetched successfully.');
    }

    public function unreadCount(Request $request)
    {
        return $this->success([
            'count' => $request->user()->unreadNotifications()->count(),
        ], 'Unread notification count fetched successfully.');
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->success(new NotificationResource($notification->fresh()), 'Notification marked as read.');
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->success(null, 'All notifications marked as read.');
    }

    public function destroy(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->delete();

        return $this->success(null, 'Notification deleted successfully.');
    }

    public function destroyAll(Request $request)
    {
        $request->user()->notifications()->delete();

        return $this->success(null, 'All notifications deleted successfully.');
    }
}
