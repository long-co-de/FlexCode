<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Network;

class NetworkController extends Controller
{
    /**
     * Display a listing of the networks.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Network::withCount('dataPlans')
            ->when($search, function($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('name');

        $networks = $query->paginate(10)
            ->withQueryString()
            ->through(function ($network) {
                return [
                    'id' => $network->id,
                    'name' => $network->name,
                    'code' => $network->code,
                    'logo' => $network->logo ? asset('storage/' . $network->logo) : null,
                    'is_active' => $network->status ?? true,
                    'data_plans_count' => $network->data_plans_count,
                    'data_profit_percentage' => $network->getDataProfitPercentage(),
                ];
            });

        // Make sure the networks object has the expected structure
        if (!isset($networks->data) && isset($networks['data'])) {
            // If data is in the root level, restructure it
            $networks = [
                'data' => $networks['data'] ?? [],
                'links' => $networks['links'] ?? null,
                'from' => $networks['from'] ?? null,
                'to' => $networks['to'] ?? null,
                'total' => $networks['total'] ?? 0,
            ];
        }

        return Inertia::render('Admin/Networks/Index', [
            'networks' => $networks,
            'filter' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new network.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Admin/Networks/Create');
    }

    /**
     * Store a newly created network in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:networks,code',
            'logo' => 'nullable|image|max:1024',
        ]);

        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'data_profit_percentage' => $request->data_profit_percentage ?? 5,
        ];

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('networks', 'public');
        }

        Network::create($data);

        return redirect()->route('admin.networks')
            ->with('success', 'Network created successfully.');
    }

    /**
     * Show the form for editing the specified network.
     *
     * @param  \App\Models\Network  $network
     * @return \Inertia\Response
     */
    public function edit(Network $network)
    {
        return Inertia::render('Admin/Networks/Edit', [
            'network' => $network,
        ]);
    }

    /**
     * Update the specified network in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Network  $network
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Network $network)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:networks,code,' . $network->id,
            'logo' => 'nullable|image|max:1024',
            'status' => 'boolean',
        ]);

        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'data_profit_percentage' => $request->data_profit_percentage ?? $network->getDataProfitPercentage(),
        ];

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($network->logo) {
                \Storage::disk('public')->delete($network->logo);
            }

            $data['logo'] = $request->file('logo')->store('networks', 'public');
        }

        $network->update($data);

        return redirect()->route('admin.networks')
            ->with('success', 'Network updated successfully.');
    }

    /**
     * Remove the specified network from storage.
     *
     * @param  \App\Models\Network  $network
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Network $network)
    {
        // Check if the network has data plans
        if ($network->dataPlans()->count() > 0) {
            return redirect()->route('admin.networks')
                ->with('error', 'Cannot delete network because it has data plans associated with it.');
        }

        // Delete logo if exists
        if ($network->logo) {
            \Storage::disk('public')->delete($network->logo);
        }

        $network->delete();

        return redirect()->route('admin.networks')
            ->with('success', 'Network deleted successfully.');
    }
}
