<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DataPlanController extends Controller
{
    public function index(Request $request)
    {
        $dataPlans = [
            ['id' => 1, 'name' => '100MB', 'price' => 100, 'validity' => '7 days', 'is_active' => true],
            ['id' => 2, 'name' => '500MB', 'price' => 400, 'validity' => '14 days', 'is_active' => true],
            ['id' => 3, 'name' => '1GB', 'price' => 800, 'validity' => '30 days', 'is_active' => true],
            ['id' => 4, 'name' => '2GB', 'price' => 1500, 'validity' => '30 days', 'is_active' => true],
        ];

        return Inertia::render('Agent/DataPlans/Index', [
            'dataPlans' => $dataPlans,
        ]);
    }

    public function toggle(Request $request, $dataPlanId)
    {
        // Toggle data plan active status
        return redirect()->back()->with('message', 'Data plan status updated');
    }
}
