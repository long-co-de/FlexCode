<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AirtimeToCash;
use App\Models\Transaction;
use App\Models\Setting;
use Illuminate\Support\Str;

class AirtimeToCashController extends AtomicController
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
            'request_id' => 'nullable|string',
        ]);

        $user = $request->user();

        // Rate limiting
        if ($this->isRateLimited($user->id, 'airtime_to_cash')) {
            return redirect()->back()->with('error', 'Too many requests. Please wait a minute.');
        }

        // Deduplication check
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'airtime_to_cash')) {
            return redirect()->back()->with('error', 'This request has already been submitted.');
        }

        // Calculate charge and amount to receive
        $chargePercentage = (float) Setting::get('airtime_to_cash_charge', 20);
        $charge = ($request->amount * $chargePercentage) / 100;
        $amountToReceive = $request->amount - $charge;

        // Generate unique reference
        $reference = 'A2C' . strtoupper(Str::random(8)) . time();

        try {
            // Process record creation atomically
            $this->processAtomicTransaction($user->id, 0, function ($lockedUser) use ($request, $reference, $charge, $amountToReceive, $requestId) {
                // Create airtime to cash record
                $airtimeToCash = AirtimeToCash::create([
                    'user_id' => $lockedUser->id,
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
                        'user_agent' => substr($request->userAgent(), 0, 255),
                        'request_id' => $requestId,
                    ],
                ]);

                // Create transaction record
                Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'airtime_to_cash',
                    'amount' => $request->amount,
                    'fee' => $charge,
                    'status' => 'pending',
                    'recipient' => $lockedUser->email,
                    'description' => 'Airtime to Cash conversion of ₦' . $request->amount . ' from ' . strtoupper($request->network) . ' (' . $request->phone_number . ')',
                    'meta_data' => [
                        'airtime_to_cash_id' => $airtimeToCash->id,
                        'network' => $request->network,
                        'phone_number' => $request->phone_number,
                        'amount_to_receive' => $amountToReceive,
                        'request_id' => $requestId,
                    ],
                ]);

                return true;
            });

            return redirect()->route('airtime-to-cash')->with('success', 'Your airtime to cash request has been submitted successfully. We will process it shortly.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error submitting request: ' . $e->getMessage());
        }
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
