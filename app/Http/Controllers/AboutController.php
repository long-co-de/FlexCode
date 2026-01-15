<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;

class AboutController extends Controller
{
    public function index()
    {
        $settings = [
            'site_name' => Setting::get('site_name'),
            'site_description' => Setting::get('site_description'),
            'contact_email' => Setting::get('contact_email'),
            'contact_phone' => Setting::get('contact_phone'),
            'about_content' => Setting::get('about_content'),
        ];

        return Inertia::render('About', [
            'settings' => $settings,
        ]);
    }
}
