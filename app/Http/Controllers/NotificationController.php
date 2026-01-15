<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Notifications\SystemNotification;

class NotificationController extends Controller
{
    /**
     * Display a listing of the user's notifications.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = Auth::user();
        $notifications = $user->notifications()->paginate(10);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a notification as read.
     *
     * @param  string  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function markAsRead($id)
    {
        $notification = Auth::user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return back()->with('success', 'Notification marked as read.');
    }

    /**
     * Mark all notifications as read.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();

        return back()->with('success', 'All notifications marked as read.');
    }

    /**
     * Delete a notification.
     *
     * @param  string  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy($id)
    {
        $notification = Auth::user()->notifications()->findOrFail($id);
        $notification->delete();

        return back()->with('success', 'Notification deleted.');
    }

    /**
     * Delete all notifications.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroyAll()
    {
        Auth::user()->notifications()->delete();

        return back()->with('success', 'All notifications deleted.');
    }

    /**
     * Get unread notifications count for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUnreadCount()
    {
        $count = Auth::user()->unreadNotifications()->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Get the latest unread notifications for the authenticated user.
     *
     * @param  int  $limit
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLatestUnread($limit = 5)
    {
        $notifications = Auth::user()->unreadNotifications()
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'data' => $notification->data,
                    'created_at' => $notification->created_at->diffForHumans(),
                ];
            });

        return response()->json(['notifications' => $notifications]);
    }

    /**
     * Send a test notification to the authenticated user.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function sendTestNotification()
    {
        $user = Auth::user();
        $user->notifyNow(new SystemNotification(
            'Test Notification',
            'This is a test notification to verify the notification system is working correctly.',
            'info',
            'View Dashboard',
            '/dashboard'
        ));
        // $users =  User::all();
        // foreach ($users as $user) {
        //     $user->notifyNow(
        //         new SystemNotification(
        //             'Test Notification',
        //             'This is a test notification to verify the notification system is working correctly.',
        //             'info',
        //             'View Dashboard',
        //             '/dashboard'
        //         )
        //     );
        // }
        return back()->with('success', 'Test notification sent.');
    }
}
