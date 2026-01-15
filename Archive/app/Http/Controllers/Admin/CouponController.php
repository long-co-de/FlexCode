<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CouponController extends Controller
{
    /**
     * Display a listing of the coupons.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $coupons = Coupon::with(['creator:id,name', 'user:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $coupons,
        ]);
    }

    /**
     * Show the form for creating a new coupon.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Admin/Coupons/Create');
    }

    /**
     * Store a newly created coupon in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'expires_at' => 'nullable|date|after:now',
            'description' => 'nullable|string|max:255',
            'quantity' => 'required|integer|min:1|max:100',
            'prefix' => 'nullable|string|max:10',
        ]);

        $user = $request->user();
        $coupons = [];
        
        // Use the provided prefix or default to 'PI'
        $prefix = $request->prefix ?: 'PI';

        for ($i = 0; $i < $request->quantity; $i++) {
            // Generate a 10-digit code (8 random digits + 2 check digits)
            $randomPart = '';
            for ($j = 0; $j < 8; $j++) {
                $randomPart .= mt_rand(0, 9);
            }
            
            // Add 2 check digits (simple implementation)
            $checkDigits = str_pad((array_sum(str_split($randomPart)) % 100), 2, '0', STR_PAD_LEFT);
            $code = $randomPart . $checkDigits;
            
            // Ensure code is unique
            while (Coupon::where('prefix', $prefix)->where('code', $code)->exists()) {
                $randomPart = '';
                for ($j = 0; $j < 8; $j++) {
                    $randomPart .= mt_rand(0, 9);
                }
                $checkDigits = str_pad((array_sum(str_split($randomPart)) % 100), 2, '0', STR_PAD_LEFT);
                $code = $randomPart . $checkDigits;
            }
            
            $coupons[] = Coupon::create([
                'prefix' => $prefix,
                'code' => $code,
                'amount' => $request->amount,
                'created_by' => $user->id,
                'expires_at' => $request->expires_at,
                'status' => 'active',
                'description' => $request->description,
            ]);
        }

        return redirect()->route('admin.coupons.index')
            ->with('success', $request->quantity . ' treasure hunt code(s) created successfully.');
    }

    /**
     * Display the specified coupon.
     *
     * @param  \App\Models\Coupon  $coupon
     * @return \Inertia\Response
     */
    public function show(Coupon $coupon)
    {
        $coupon->load(['creator:id,name', 'user:id,name,email']);
        
        return Inertia::render('Admin/Coupons/Show', [
            'coupon' => $coupon,
        ]);
    }

    /**
     * Remove the specified coupon from storage.
     *
     * @param  \App\Models\Coupon  $coupon
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Coupon $coupon)
    {
        if ($coupon->status === 'used') {
            return back()->with('error', 'Cannot delete a used coupon.');
        }
        
        $coupon->delete();
        
        return redirect()->route('admin.coupons.index')
            ->with('success', 'Coupon deleted successfully.');
    }
}
