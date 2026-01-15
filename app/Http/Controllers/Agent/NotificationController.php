<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = [];

        return Inertia::render('Agent/Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        // Send notification logic here

        return redirect()->back()->with('message', 'Notification sent successfully');
    }
}
