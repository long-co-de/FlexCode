<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $settings = [
            'notifications_enabled' => true,
            'email_notifications' => true,
            'sms_notifications' => false,
            'commission_rate' => 2.5,
        ];

        return Inertia::render('Agent/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'notifications_enabled' => 'boolean',
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
        ]);

        // Update settings in database
        return redirect()->back()->with('message', 'Settings updated successfully');
    }
}
