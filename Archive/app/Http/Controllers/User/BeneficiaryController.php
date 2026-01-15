<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Beneficiary;
use App\Models\Network;

class BeneficiaryController extends Controller
{
    /**
     * Display a listing of the beneficiaries.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $serviceType = $request->query('type', 'all');
        
        $query = Beneficiary::where('user_id', $user->id);
        
        if ($serviceType !== 'all') {
            $query->where('service_type', $serviceType);
        }
        
        $beneficiaries = $query->with('network')
            ->orderBy('is_favorite', 'desc')
            ->orderBy('name')
            ->get();
        
        return Inertia::render('User/Beneficiaries', [
            'beneficiaries' => $beneficiaries,
            'serviceType' => $serviceType,
        ]);
    }
    
    /**
     * Store a newly created beneficiary.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'service_type' => 'required|string|in:airtime,data,cable,electricity,bank_transfer',
            'network_id' => 'nullable|exists:networks,id',
            'is_favorite' => 'boolean',
            'meta_data' => 'nullable|array',
        ]);
        
        $beneficiary = Beneficiary::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'phone_number' => $validated['phone_number'],
            'service_type' => $validated['service_type'],
            'network_id' => $validated['network_id'] ?? null,
            'is_favorite' => $validated['is_favorite'] ?? false,
            'meta_data' => $validated['meta_data'] ?? null,
        ]);
        
        return redirect()->back()->with('success', 'Beneficiary added successfully.');
    }
    
    /**
     * Update the specified beneficiary.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Beneficiary  $beneficiary
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Beneficiary $beneficiary)
    {
        $this->authorize('update', $beneficiary);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'service_type' => 'required|string|in:airtime,data,cable,electricity,bank_transfer',
            'network_id' => 'nullable|exists:networks,id',
            'is_favorite' => 'boolean',
            'meta_data' => 'nullable|array',
        ]);
        
        $beneficiary->update($validated);
        
        return redirect()->back()->with('success', 'Beneficiary updated successfully.');
    }
    
    /**
     * Toggle the favorite status of a beneficiary.
     *
     * @param  \App\Models\Beneficiary  $beneficiary
     * @return \Illuminate\Http\RedirectResponse
     */
    public function toggleFavorite(Beneficiary $beneficiary)
    {
        $this->authorize('update', $beneficiary);
        
        $beneficiary->is_favorite = !$beneficiary->is_favorite;
        $beneficiary->save();
        
        return redirect()->back()->with('success', 'Beneficiary favorite status updated.');
    }
    
    /**
     * Remove the specified beneficiary.
     *
     * @param  \App\Models\Beneficiary  $beneficiary
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Beneficiary $beneficiary)
    {
        $this->authorize('delete', $beneficiary);
        
        $beneficiary->delete();
        
        return redirect()->back()->with('success', 'Beneficiary deleted successfully.');
    }
}