<?php

namespace App\Traits;

use App\Models\Setting;
use Illuminate\Support\Facades\Auth;

trait ProProfitCalculator
{
    protected function getProProfitMargin($amount, $type)
    {
        $user = Auth::user();
        $settings = Setting::first();

        if (!$user->is_pro || $user->pro_expires_at <= now()) {
            return 0;
        }

        $percentageField = "pro_{$type}_profit_percentage";
        return $amount * ($settings->$percentageField / 100);
    }

    protected function isProUser()
    {
        $user = Auth::user();
        return $user->is_pro && $user->pro_expires_at > now();
    }
}
