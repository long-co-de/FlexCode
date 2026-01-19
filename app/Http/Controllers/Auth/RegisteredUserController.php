<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // List of allowed email domains
        $allowedDomains = [
            'gmail.com',
            'icloud.com',
            'outlook.com',
            'yahoo.com',
            'yahoo.co.uk',
            'hotmail.com',
            'aol.com',
            'mail.com',
            'protonmail.com',
            'zoho.com',
        ];

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:'.User::class,
                function ($attribute, $value, $fail) use ($allowedDomains) {
                    $emailDomain = strtolower(substr(strrchr($value, "@"), 1));
                    if (!in_array($emailDomain, $allowedDomains)) {
                        $fail('Email domain is not supported. Please use a known email provider (Gmail, iCloud, Outlook, Yahoo, etc.)');
                    }
                },
            ],
            'phone_number' => 'required|string|max:20|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'referral_code' => 'nullable|string|exists:users,referral_code',
        ]);

        $referredBy = null;
        if ($request->referral_code) {
            $referrer = User::where('referral_code', $request->referral_code)->first();
            if ($referrer) {
                $referredBy = $referrer->id;
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'wallet_balance' => 0,
            'referral_code' => Str::random(8),
            'referred_by' => $referredBy,
            'role' => 'user',
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(RouteServiceProvider::HOME);
    }
}