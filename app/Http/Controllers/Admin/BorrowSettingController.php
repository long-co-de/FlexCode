<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BorrowSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BorrowSettingController extends Controller
{
    public function index()
    {
        $borrowSettings = BorrowSetting::all();

        return Inertia::render('Admin/BorrowSettings/Index', [
            'borrowSettings' => $borrowSettings,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/BorrowSettings/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_type' => 'required|string|unique:borrow_settings,service_type|in:airtime,data,electricity,cable',
            'min_amount' => 'sometimes',
            'max_amount' => 'sometimes',
            'base_interest_rate' => 'sometimes',
            'good_credit_interest_rate' => 'sometimes',
            'due_days' => 'sometimes',
            'is_active' => 'sometimes|boolean',
        ]);

        BorrowSetting::create($validated);

        return redirect()->route('admin.borrow-settings.index')
            ->with('success', 'Borrow setting created successfully');
    }

    public function edit(BorrowSetting $borrowSetting)
    {
        return Inertia::render('Admin/BorrowSettings/Edit', [
            'borrowSetting' => $borrowSetting,
        ]);
    }

    public function update(Request $request, BorrowSetting $borrowSetting)
    {
        $validated = $request->validate([
            'min_amount' => 'sometimes',
            'max_amount' => 'sometimes',
            'base_interest_rate' => 'sometimes',
            'good_credit_interest_rate' => 'sometimes',
            'due_days' => 'sometimes',
            'is_active' => 'sometimes|boolean',
        ]);

        $borrowSetting->update($validated);

        return redirect()->route('admin.borrow-settings.index')
            ->with('success', 'Borrow setting updated successfully');
    }

    public function destroy(BorrowSetting $borrowSetting)
    {
        $borrowSetting->delete();

        return redirect()->route('admin.borrow-settings.index')
            ->with('success', 'Borrow setting deleted successfully');
    }
}
