<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditEligibilitySetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditEligibilitySettingController extends Controller
{
    public function index()
    {
        $settings = CreditEligibilitySetting::all();

        return Inertia::render('Admin/CreditEligibilitySettings/Index', [
            'settings' => $settings,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/CreditEligibilitySettings/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_type' => 'required|string|unique:credit_eligibility_settings,service_type|in:airtime,data,electricity,cable',
            'min_credit_score' => 'sometimes',
            'credit_limit_90_plus' => 'sometimes',
            'credit_limit_80_89' => 'sometimes',
            'credit_limit_70_79' => 'sometimes',
            'credit_limit_60_69' => 'sometimes',
            'credit_limit_50_59' => 'sometimes',
            'credit_limit_40_49' => 'sometimes',
            'min_account_age_days' => 'sometimes',
            'min_transaction_count' => 'sometimes',
            'is_active' => 'sometimes|boolean',
        ]);

        CreditEligibilitySetting::create($validated);

        return redirect()->route('admin.credit-eligibility-settings.index')
            ->with('success', 'Credit eligibility setting created successfully');
    }

    public function edit(CreditEligibilitySetting $creditEligibilitySetting)
    {
        return Inertia::render('Admin/CreditEligibilitySettings/Edit', [
            'setting' => $creditEligibilitySetting,
        ]);
    }

    public function update(Request $request, CreditEligibilitySetting $creditEligibilitySetting)
    {
        $validated = $request->validate([
            'min_credit_score' => 'sometimes',
            'credit_limit_90_plus' => 'sometimes',
            'credit_limit_80_89' => 'sometimes',
            'credit_limit_70_79' => 'sometimes',
            'credit_limit_60_69' => 'sometimes',
            'credit_limit_50_59' => 'sometimes',
            'credit_limit_40_49' => 'sometimes',
            'min_account_age_days' => 'sometimes',
            'min_transaction_count' => 'sometimes',
            'is_active' => 'sometimes|boolean',
        ]);

        $creditEligibilitySetting->update($validated);

        return redirect()->route('admin.credit-eligibility-settings.index')
            ->with('success', 'Credit eligibility setting updated successfully');
    }

    public function destroy(CreditEligibilitySetting $creditEligibilitySetting)
    {
        $creditEligibilitySetting->delete();

        return redirect()->route('admin.credit-eligibility-settings.index')
            ->with('success', 'Credit eligibility setting deleted successfully');
    }
}
