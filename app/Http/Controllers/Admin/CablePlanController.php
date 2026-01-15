<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CablePlan;
use App\Models\CableProvider;

class CablePlanController extends Controller
{
    /**
     * Display a listing of the cable plans.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $cablePlans = CablePlan::with('cableProvider')
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Admin/CablePlans/Index', [
            'cablePlans' => $cablePlans,
        ]);
    }
    
    /**
     * Show the form for creating a new cable plan.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $cableProviders = CableProvider::where('status', true)
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Admin/CablePlans/Create', [
            'cableProviders' => $cableProviders,
        ]);
    }
    
    /**
     * Store a newly created cable plan in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'cable_provider_id' => 'required|exists:cable_providers,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:cable_plans,code',
            'amount' => 'required|numeric|min:0',
            'status' => 'boolean',
        ]);
        
        CablePlan::create([
            'cable_provider_id' => $request->cable_provider_id,
            'name' => $request->name,
            'code' => $request->code,
            'amount' => $request->amount,
            'status' => $request->status ?? true,
        ]);
        
        return redirect()->route('admin.cable-plans')
            ->with('success', 'Cable plan created successfully.');
    }
    
    /**
     * Show the form for editing the specified cable plan.
     *
     * @param  \App\Models\CablePlan  $cablePlan
     * @return \Inertia\Response
     */
    public function edit(CablePlan $cablePlan)
    {
        $cableProviders = CableProvider::where('status', true)
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Admin/CablePlans/Edit', [
            'cablePlan' => $cablePlan,
            'cableProviders' => $cableProviders,
        ]);
    }
    
    /**
     * Update the specified cable plan in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\CablePlan  $cablePlan
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, CablePlan $cablePlan)
    {
        $request->validate([
            'cable_provider_id' => 'required|exists:cable_providers,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:cable_plans,code,' . $cablePlan->id,
            'amount' => 'required|numeric|min:0',
            'status' => 'boolean',
        ]);
        
        $cablePlan->update([
            'cable_provider_id' => $request->cable_provider_id,
            'name' => $request->name,
            'code' => $request->code,
            'amount' => $request->amount,
            'status' => $request->status ?? $cablePlan->status,
        ]);
        
        return redirect()->route('admin.cable-plans')
            ->with('success', 'Cable plan updated successfully.');
    }
    
    /**
     * Remove the specified cable plan from storage.
     *
     * @param  \App\Models\CablePlan  $cablePlan
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(CablePlan $cablePlan)
    {
        // Check if the cable plan is being used in any transactions
        // This would require a Transaction model with a relationship to CablePlan
        // If such a relationship exists, you should add a check here
        
        $cablePlan->delete();
        
        return redirect()->route('admin.cable-plans')
            ->with('success', 'Cable plan deleted successfully.');
    }
}