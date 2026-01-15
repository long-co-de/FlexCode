<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ElectricityProvider;

class ElectricityProviderController extends Controller
{
    /**
     * Display a listing of the electricity providers.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $electricityProviders = ElectricityProvider::orderBy('name')->get();
            
        return Inertia::render('Admin/ElectricityProviders/Index', [
            'electricityProviders' => $electricityProviders,
        ]);
    }
    
    /**
     * Show the form for creating a new electricity provider.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Admin/ElectricityProviders/Create');
    }
    
    /**
     * Store a newly created electricity provider in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:electricity_providers,code',
            'logo' => 'nullable|image|max:1024',
            'status' => 'boolean',
        ]);
        
        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'status' => $request->status ?? true,
        ];
        
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('electricity_providers', 'public');
        }
        
        ElectricityProvider::create($data);
        
        return redirect()->route('admin.electricity-providers')
            ->with('success', 'Electricity provider created successfully.');
    }
    
    /**
     * Show the form for editing the specified electricity provider.
     *
     * @param  \App\Models\ElectricityProvider  $electricityProvider
     * @return \Inertia\Response
     */
    public function edit(ElectricityProvider $electricityProvider)
    {
        return Inertia::render('Admin/ElectricityProviders/Edit', [
            'electricityProvider' => $electricityProvider,
        ]);
    }
    
    /**
     * Update the specified electricity provider in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\ElectricityProvider  $electricityProvider
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, ElectricityProvider $electricityProvider)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:electricity_providers,code,' . $electricityProvider->id,
            'logo' => 'nullable|image|max:1024',
            'status' => 'boolean',
        ]);
        
        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'status' => $request->status ?? $electricityProvider->status,
        ];
        
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($electricityProvider->logo) {
                \Storage::disk('public')->delete($electricityProvider->logo);
            }
            
            $data['logo'] = $request->file('logo')->store('electricity_providers', 'public');
        }
        
        $electricityProvider->update($data);
        
        return redirect()->route('admin.electricity-providers')
            ->with('success', 'Electricity provider updated successfully.');
    }
    
    /**
     * Remove the specified electricity provider from storage.
     *
     * @param  \App\Models\ElectricityProvider  $electricityProvider
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(ElectricityProvider $electricityProvider)
    {
        // Check if the electricity provider is being used in any transactions
        // This would require a Transaction model with a relationship to ElectricityProvider
        // If such a relationship exists, you should add a check here
        
        // Delete logo if exists
        if ($electricityProvider->logo) {
            \Storage::disk('public')->delete($electricityProvider->logo);
        }
        
        $electricityProvider->delete();
        
        return redirect()->route('admin.electricity-providers')
            ->with('success', 'Electricity provider deleted successfully.');
    }
}