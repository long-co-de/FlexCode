<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PaymentMethod;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of the payment methods.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        
        $query = PaymentMethod::withCount('walletFundings');
        
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }
        
        $paymentMethods = $query->orderBy('name')
            ->paginate(10);
            
        return Inertia::render('Admin/PaymentMethods/Index', [
            'paymentMethods' => $paymentMethods,
            'filter' => [
                'search' => $search,
            ],
        ]);
    }
    
    /**
     * Show the form for creating a new payment method.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Admin/PaymentMethods/Create');
    }
    
    /**
     * Store a newly created payment method in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:payment_methods,code',
            'logo' => 'nullable|image|max:1024',
            'status' => 'boolean',
        ]);
        
        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'status' => $request->status ?? true,
        ];
        
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('payment_methods', 'public');
        }
        
        PaymentMethod::create($data);
        
        return redirect()->route('admin.payment-methods')
            ->with('success', 'Payment method created successfully.');
    }
    
    /**
     * Show the form for editing the specified payment method.
     *
     * @param  \App\Models\PaymentMethod  $paymentMethod
     * @return \Inertia\Response
     */
    public function edit(PaymentMethod $paymentMethod)
    {
        return Inertia::render('Admin/PaymentMethods/Edit', [
            'paymentMethod' => $paymentMethod,
        ]);
    }
    
    /**
     * Update the specified payment method in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\PaymentMethod  $paymentMethod
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:payment_methods,code,' . $paymentMethod->id,
            'logo' => 'nullable|image|max:1024',
            'status' => 'boolean',
        ]);
        
        $data = [
            'name' => $request->name,
            'code' => $request->code,
            'status' => $request->status ?? $paymentMethod->status,
        ];
        
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($paymentMethod->logo) {
                \Storage::disk('public')->delete($paymentMethod->logo);
            }
            
            $data['logo'] = $request->file('logo')->store('payment_methods', 'public');
        }
        
        $paymentMethod->update($data);
        
        return redirect()->route('admin.payment-methods')
            ->with('success', 'Payment method updated successfully.');
    }
    
    /**
     * Remove the specified payment method from storage.
     *
     * @param  \App\Models\PaymentMethod  $paymentMethod
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(PaymentMethod $paymentMethod)
    {
        // Check if the payment method has wallet fundings
        if ($paymentMethod->walletFundings()->count() > 0) {
            return redirect()->route('admin.payment-methods')
                ->with('error', 'Cannot delete payment method because it has wallet fundings associated with it.');
        }
        
        // Delete logo if exists
        if ($paymentMethod->logo) {
            \Storage::disk('public')->delete($paymentMethod->logo);
        }
        
        $paymentMethod->delete();
        
        return redirect()->route('admin.payment-methods')
            ->with('success', 'Payment method deleted successfully.');
    }
}