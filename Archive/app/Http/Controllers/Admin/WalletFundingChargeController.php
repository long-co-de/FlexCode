<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WalletFundingCharge;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletFundingChargeController extends Controller
{
    /**
     * Display a listing of the wallet funding charges.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $charges = WalletFundingCharge::with(['creator:id,name', 'updater:id,name'])
            ->orderBy('payment_method')
            ->get();
        
        $paymentMethods = PaymentMethod::where('is_active', true)->get();
        
        return Inertia::render('Admin/WalletFundingCharges/Index', [
            'charges' => $charges,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Store a newly created wallet funding charge in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
        ]);

        // Check if a charge for this payment method already exists
        $existingCharge = WalletFundingCharge::where('payment_method', $request->payment_method)->first();
        
        if ($existingCharge) {
            return redirect()->back()->with('error', 'A charge for this payment method already exists. Please update the existing one.');
        }

        WalletFundingCharge::create([
            'payment_method' => $request->payment_method,
            'percentage' => $request->percentage,
            'is_active' => true,
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        return redirect()->route('admin.wallet-funding-charges.index')->with('success', 'Wallet funding charge created successfully.');
    }

    /**
     * Update the specified wallet funding charge in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\WalletFundingCharge  $walletFundingCharge
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, WalletFundingCharge $walletFundingCharge)
    {
        $request->validate([
            'percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'required|boolean',
        ]);

        $walletFundingCharge->update([
            'percentage' => $request->percentage,
            'is_active' => $request->is_active,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->route('admin.wallet-funding-charges.index')->with('success', 'Wallet funding charge updated successfully.');
    }

    /**
     * Remove the specified wallet funding charge from storage.
     *
     * @param  \App\Models\WalletFundingCharge  $walletFundingCharge
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(WalletFundingCharge $walletFundingCharge)
    {
        $walletFundingCharge->delete();

        return redirect()->route('admin.wallet-funding-charges.index')->with('success', 'Wallet funding charge deleted successfully.');
    }
}