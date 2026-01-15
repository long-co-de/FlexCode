<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProController extends Controller
{
    public function index()
    {
        return Inertia::render('User/UpgradePro');
    }

    public function upgrade(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|string',
            'duration' => 'required|integer|min:1|max:12',
        ]);

        $user = Auth::user();

        // Process payment here...

        // Update user status
        $user->is_pro = true;
        $user->pro_expires_at = now()->addMonths($request->duration);
        $user->save();

        return redirect()->route('dashboard')->with('success', 'Successfully upgraded to Pro!');
    }

    public function getProBannerTemplates()
    {
        $settings = Setting::first();
        return response()->json([
            'templates' => json_decode($settings->pro_banner_templates, true)
        ]);
    }
}
