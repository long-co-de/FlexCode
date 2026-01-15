<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class WalletFundingController extends Controller
{
    public function index(Request $request)
    {
        $walletFundings = [];

        return Inertia::render('Agent/WalletFundings/Index', [
            'walletFundings' => $walletFundings,
        ]);
    }

    public function show($funding)
    {
        return Inertia::render('Agent/WalletFundings/Show', [
            'funding' => $funding,
        ]);
    }

    public function approve(Request $request, $fundingId)
    {
        return redirect()->back()->with('message', 'Wallet funding approved');
    }

    public function reject(Request $request, $fundingId)
    {
        return redirect()->back()->with('message', 'Wallet funding rejected');
    }
}
