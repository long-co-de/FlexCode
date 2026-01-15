<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DataPlan;
use App\Models\Network;
use App\Models\PlanTypeProfit;
use Illuminate\Pagination\Paginator;

class DataPlanController extends Controller
{
    /**
     * Display a listing of the data plans.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $dds = DataPlan::with('network')
            ->orderBy('network_id')->paginate(10);
            // ->orderBy('name');

        $networks = Network::all();
        return Inertia::render('Admin/DataPlans/Index', [
            'dataPlans' => $dds,
            'networks' => $networks,
        ]);
    }

    /**
     * Show the form for creating a new data plan.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $networks = Network::where('name', '!=','')
            ->orderBy('name')
            ->get();

        $planTypes = PlanTypeProfit::where('is_active', true)
            ->orderBy('plan_type')
            ->get();

        return Inertia::render('Admin/DataPlans/Create', [
            'networks' => $networks,
            'planTypes' => $planTypes,
        ]);
    }

    /**
     * Store a newly created data plan in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'network_id' => 'required|exists:networks,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:data_plans,code',
            'plan_type' => 'nullable|string|max:50',
            'dataplan_id' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'validity' => 'nullable|string|max:50',
            'data_amount' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $dataPlan = DataPlan::create([
            'network_id' => $request->network_id,
            'name' => $request->name,
            'code' => $request->code,
            'plan_type' => $request->plan_type,
            'dataplan_id' => $request->dataplan_id,
            'price' => $request->price,
            'validity' => $request->validity,
            'data_amount' => $request->data_amount,
            'is_active' => $request->is_active ?? true,
        ]);

        // Calculate and update selling price
        $dataPlan->updateSellingPrice();

        return redirect()->route('admin.data-plans')
            ->with('success', 'Data plan created successfully.');
    }

    /**
     * Show the form for editing the specified data plan.
     *
     * @param  \App\Models\DataPlan  $dataPlan
     * @return \Inertia\Response
     */
    public function edit(DataPlan $dataPlan)
    {
        $networks = Network::where('name', '!=','')
            ->orderBy('name')
            ->get();

        $planTypes = PlanTypeProfit::where('is_active', true)
            ->orderBy('plan_type')
            ->get();

        return Inertia::render('Admin/DataPlans/Edit', [
            'dataPlan' => $dataPlan,
            'networks' => $networks,
            'planTypes' => $planTypes,
        ]);
    }

    /**
     * Update the specified data plan in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\DataPlan  $dataPlan
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, DataPlan $dataPlan)
    {
        $request->validate([
            'network_id' => 'required|exists:networks,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:data_plans,code,' . $dataPlan->id,
            'plan_type' => 'nullable|string|max:50',
            'dataplan_id' => 'nullable|string|max:50',
            'amount' => 'required|numeric|min:0',
            'validity' => 'nullable|string|max:50',
            'data_amount' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $dataPlan->update([
            'network_id' => $request->network_id,
            'name' => $request->name,
            'code' => $request->code,
            'plan_type' => $request->plan_type,
            'dataplan_id' => $request->dataplan_id,
            'price' => $request->amount,
            'validity' => $request->validity,
            'data_amount' => $request->data_amount ?? $request->amount,
            'is_active' => $request->is_active ?? $dataPlan->is_active,
        ]);

        // Calculate and update selling price
        $dataPlan->updateSellingPrice();

        return redirect()->route('admin.data-plans')
            ->with('success', 'Data plan updated successfully.');
    }

    /**
     * Remove the specified data plan from storage.
     *
     * @param  \App\Models\DataPlan  $dataPlan
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(DataPlan $dataPlan)
    {
        // Check if the data plan is being used in any transactions
        // This would require a Transaction model with a relationship to DataPlan
        // If such a relationship exists, you should add a check here

        $dataPlan->delete();

        return redirect()->route('admin.data-plans')
            ->with('success', 'Data plan deleted successfully.');
    }
}
