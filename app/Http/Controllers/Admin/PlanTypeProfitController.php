<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DataPlan;
use App\Models\PlanTypeProfit;
use App\Services\DatavendroService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanTypeProfitController extends Controller
{
    /**
     * Display a listing of the plan type profits.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $planTypeProfits = PlanTypeProfit::withCount('dataPlans')
            ->orderBy('plan_type')
            ->get();

        return Inertia::render('Admin/PlanTypeProfits/Index', [
            'planTypeProfits' => $planTypeProfits,
        ]);
    }

    /**
     * Show the form for creating a new plan type profit.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        // Get all unique plan types from data plans that don't have a profit percentage yet
        $existingPlanTypes = PlanTypeProfit::pluck('plan_type')->toArray();
        $availablePlanTypes = DataPlan::whereNotIn('plan_type', $existingPlanTypes)
            ->where('plan_type', '!=', null)
            ->distinct()
            ->pluck('plan_type')
            ->toArray();

        return Inertia::render('Admin/PlanTypeProfits/Create', [
            'availablePlanTypes' => $availablePlanTypes,
        ]);
    }

    /**
     * Store a newly created plan type profit in storage.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'plan_type' => 'required|string|unique:plan_type_profits,plan_type',
            'profit_percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $planTypeProfit = PlanTypeProfit::create([
            'plan_type' => $request->plan_type,
            'profit_percentage' => $request->profit_percentage,
            'is_active' => $request->is_active ?? true,
        ]);

        // Update selling prices for all data plans with this plan type
        $dataPlans = DataPlan::where('plan_type', $planTypeProfit->plan_type)->get();
        foreach ($dataPlans as $dataPlan) {
            $dataPlan->updateSellingPrice();
        }

        return redirect()->route('admin.plan-type-profits.index')
            ->with('success', 'Plan type profit percentage created successfully.');
    }

    /**
     * Show the form for editing the specified plan type profit.
     *
     * @return \Inertia\Response
     */
    public function edit(PlanTypeProfit $planTypeProfit)
    {
        return Inertia::render('Admin/PlanTypeProfits/Edit', [
            'planTypeProfit' => $planTypeProfit,
        ]);
    }

    /**
     * Update the specified plan type profit in storage.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, PlanTypeProfit $planTypeProfit)
    {
        $request->validate([
            'profit_percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $planTypeProfit->update([
            'profit_percentage' => $request->profit_percentage,
            'is_active' => $request->is_active ?? $planTypeProfit->is_active,
        ]);

        // Update selling prices for all data plans with this plan type
        $dataPlans = DataPlan::where('plan_type', $planTypeProfit->plan_type)->get();
        foreach ($dataPlans as $dataPlan) {
            $dataPlan->updateSellingPrice();
        }

        return redirect()->route('admin.plan-type-profits.index')
            ->with('success', 'Plan type profit percentage updated successfully.');
    }

    /**
     * Remove the specified plan type profit from storage.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(PlanTypeProfit $planTypeProfit)
    {
        // Check if there are data plans using this plan type
        $dataPlansCount = DataPlan::where('plan_type', $planTypeProfit->plan_type)->count();

        if ($dataPlansCount > 0) {
            return redirect()->route('admin.plan-type-profits.index')
                ->with('error', 'Cannot delete this plan type profit percentage because it is being used by '.$dataPlansCount.' data plans.');
        }

        $planTypeProfit->delete();

        return redirect()->route('admin.plan-type-profits.index')
            ->with('success', 'Plan type profit percentage deleted successfully.');
    }

    /**
     * Update all data plans selling prices based on their plan type profit percentages.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateAllSellingPrices()
    {
        $dataPlans = DataPlan::all();

        foreach ($dataPlans as $dataPlan) {
            $dataPlan->updateSellingPrice();
        }

        return redirect()->route('admin.plan-type-profits.index')
            ->with('success', 'All data plan selling prices updated successfully.');
    }

    /**
     * Fetch latest data plans from API and update the database.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function fetchFromApi()
    {
        $datavendroService = app(DatavendroService::class);
        $response = $datavendroService->getAllDataPlans(true);

        if ($response['success']) {
            return redirect()->route('admin.plan-type-profits.index')
                ->with('success', 'Data plans updated successfully from API.');
        } else {
            return redirect()->route('admin.plan-type-profits.index')
                ->with('error', 'Failed to update data plans from API: '.($response['message'] ?? 'Unknown error'));
        }
    }
}
