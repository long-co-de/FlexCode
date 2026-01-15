<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CableProvider;

class CableProviderController extends Controller
{
    /**
     * Display a listing of the cable providers.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $cableProviders = CableProvider::withCount('cablePlans')
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Admin/CableProviders/Index', [
            'cableProviders' => $cableProviders,
        ]);
    }
    
    /**
     * Show the form for creating a new cable provider.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Admin/CableProviders/Create');
    }
    
    /**
     * Store a newly created cable provider in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:cable_providers,code',
            'logo' => 'nullable|image|max:1024',
            'status' => 'boolean',
        ]);
        
        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'status' => $request->status ?? true,
        ];
        
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('cable_providers', 'public');
        }
        
        CableProvider::create($data);
        
        return redirect()->route('admin.cable-providers')
            ->with('success', 'Cable provider created successfully.');
    }
    
    /**
     * Show the form for editing the specified cable provider.
     *
     * @param  \App\Models\CableProvider  $cableProvider
     * @return \Inertia\Response
     */
    public function edit(CableProvider $cableProvider)
    {
        return Inertia::render('Admin/CableProviders/Edit', [
            'cableProvider' => $cableProvider,
        ]);
    }
    
    /**
     * Update the specified cable provider in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\CableProvider  $cableProvider
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, CableProvider $cableProvider)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:cable_providers,code,' . $cableProvider->id,
            'logo' => 'nullable|image|max:1024',
            'status' => 'boolean',
        ]);
        
        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'status' => $request->status ?? $cableProvider->status,
        ];
        
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($cableProvider->logo) {
                \Storage::disk('public')->delete($cableProvider->logo);
            }
            
            $data['logo'] = $request->file('logo')->store('cable_providers', 'public');
        }
        
        $cableProvider->update($data);
        
        return redirect()->route('admin.cable-providers')
            ->with('success', 'Cable provider updated successfully.');
    }
    
    /**
     * Remove the specified cable provider from storage.
     *
     * @param  \App\Models\CableProvider  $cableProvider
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(CableProvider $cableProvider)
    {
        // Check if the cable provider has cable plans
        if ($cableProvider->cablePlans()->count() > 0) {
            return redirect()->route('admin.cable-providers')
                ->with('error', 'Cannot delete cable provider because it has cable plans associated with it.');
        }
        
        // Delete logo if exists
        if ($cableProvider->logo) {
            \Storage::disk('public')->delete($cableProvider->logo);
        }
        
        $cableProvider->delete();
        
        return redirect()->route('admin.cable-providers')
            ->with('success', 'Cable provider deleted successfully.');
    }
}