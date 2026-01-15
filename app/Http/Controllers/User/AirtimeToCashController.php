<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AirtimeToCash;
use App\Models\Transaction;
use App\Models\Setting;
use Illuminate\Support\Str;

class AirtimeToCashController extends Controller
{
    /**
     * Display the airtime to cash page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        
        // Get recent airtime to cash transactions
        $recentTransactions = AirtimeToCash::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        // Get airtime to cash charge percentage
        $chargePercentage = (float) Setting::get('airtime_to_cash_charge', 20);
        
        // Get available networks
        $networks = [
            ['id' => 'mtn', 'name' => 'MTN', 'logo' => '/images/networks/mtn.png'],
            ['id' => 'airtel', 'name' => 'Airtel', 'logo' => '/images/networks/airtel.png'],
            ['id' => 'glo', 'name' => 'Glo', 'logo' => '/images/networks/glo.png'],
            ['id' => '9mobile', 'name' => '9Mobile', 'logo' => '/images/networks/9mobile.png'],
        ];
        
        return Inertia::render('User/AirtimeToCash', [
            'recentTransactions' => $recentTransactions,
            'chargePercentage' => $chargePercentage,
            'networks' => $networks,
        ]);
    }
    
    /**
     * Submit an airtime to cash request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'network' => 'required|string|in:mtn,airtel,glo,9mobile',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'amount' => 'required|numeric|min:500|max:50000',
            'user_note' => 'nullable|string|max:500',
        ]);
        
        $user = $request->user();
        
        // Calculate charge and amount to receive
        $chargePercentage = (float) Setting::get('airtime_to_cash_charge', 20);
        $charge = ($request->amount * $chargePercentage) / 100;
        $amountToReceive = $request->amount - $charge;
        
        // Generate unique reference
        $reference = 'A2C' . strtoupper(Str::random(8));
        
        // Create airtime to cash record
        $airtimeToCash = AirtimeToCash::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'network' => $request->network,
            'phone_number' => $request->phone_number,
            'amount' => $request->amount,
            'fee' => $charge,
            'amount_to_receive' => $amountToReceive,
            'status' => 'pending',
            'user_note' => $request->user_note,
            'meta_data' => [
                'initiated_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ],
        ]);
        
        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'airtime_to_cash',
            'amount' => $request->amount,
            'fee' => $charge,
            'status' => 'pending',
            'recipient' => $user->email,
            'description' => 'Airtime to Cash conversion of ₦' . $request->amount . ' from ' . strtoupper($request->network) . ' (' . $request->phone_number . ')',
            'meta_data' => [
                'airtime_to_cash_id' => $airtimeToCash->id,
                'network' => $request->network,
                'phone_number' => $request->phone_number,
                'amount_to_receive' => $amountToReceive,
            ],
        ]);
        
        return redirect()->route('airtime-to-cash')->with('success', 'Your airtime to cash request has been submitted successfully. We will process it shortly.');
    }
    
    /**
     * Show the details of an airtime to cash transaction.
     *
     * @param  \App\Models\AirtimeToCash  $airtimeToCash
     * @return \Inertia\Response
     */
    public function show(AirtimeToCash $airtimeToCash)
    {
        // Ensure the user can only view their own transactions
        if ($airtimeToCash->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }
        
        // Load the transaction relationship
        $airtimeToCash->load('transaction');
        
        return Inertia::render('User/AirtimeToCashDetails', [
            'transaction' => $airtimeToCash,
        ]);
    }
}
