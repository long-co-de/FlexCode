<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Models\CablePlan;
use App\Models\CableProvider;
use App\Models\DataPlan;
use App\Models\ElectricityProvider;
use App\Models\Network;

class CatalogController extends Controller
{
    public function networks()
    {
        $networks = Network::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success($networks, 'Networks fetched successfully.');
    }

    public function dataPlans(string $network)
    {
        $networkModel = Network::where('code', $network)
            ->orWhere('id', $network)
            ->firstOrFail();

        $plans = DataPlan::where('network_id', $networkModel->id)
            ->where('is_active', true)
            ->orderBy('selling_price')
            ->get();

        return $this->success([
            'network' => $networkModel,
            'plans' => $plans,
        ], 'Data plans fetched successfully.');
    }

    public function cableProviders()
    {
        return $this->success(CableProvider::where('is_active', true)->get(), 'Cable providers fetched successfully.');
    }

    public function cablePlans(string $provider)
    {
        $providerModel = CableProvider::where('code', $provider)
            ->orWhere('id', $provider)
            ->firstOrFail();

        return $this->success([
            'provider' => $providerModel,
            'plans' => CablePlan::where('provider_id', $providerModel->id)->where('is_active', true)->orderBy('selling_price')->get(),
        ], 'Cable plans fetched successfully.');
    }

    public function electricityProviders()
    {
        return $this->success(ElectricityProvider::where('is_active', true)->get(), 'Electricity providers fetched successfully.');
    }
}
