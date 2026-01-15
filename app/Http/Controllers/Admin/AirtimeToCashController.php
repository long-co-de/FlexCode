<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AirtimeToCash;
use App\Models\Transaction;
use App\Models\User;

class AirtimeToCashController extends Controller
{
    /**
     * Display a listing of airtime to cash requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = AirtimeToCash::with('user')
            ->orderBy('created_at', 'desc');
        
        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }
        
        $transactions = $query->paginate(15)
            ->withQueryString();
        
        return Inertia::render('Admin/AirtimeToCash/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['status', 'search']),
        ]);
    }
    
    /**
     * Show the details of an airtime to cash request.
     *
     * @param  \App\Models\AirtimeToCash  $airtimeToCash
     * @return \Inertia\Response
     */
    public function show(AirtimeToCash $airtimeToCash)
    {
        $airtimeToCash->load(['user', 'transaction']);
        
        return Inertia::render('Admin/AirtimeToCash/Show', [
            'transaction' => $airtimeToCash,
        ]);
    }
    
    /**
     * Update the status of an airtime to cash request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\AirtimeToCash  $airtimeToCash
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateStatus(Request $request, AirtimeToCash $airtimeToCash)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,successful,failed',
            'admin_note' => 'nullable|string|max:500',
        ]);
        
        $oldStatus = $airtimeToCash->status;
        $newStatus = $request->status;
        
        // Update airtime to cash record
        $airtimeToCash->status = $newStatus;
        $airtimeToCash->admin_note = $request->admin_note;
        $airtimeToCash->save();
        
        // Update related transaction
        $transaction = Transaction::where('reference', $airtimeToCash->reference)->first();
        if ($transaction) {
            $transaction->status = $newStatus;
            $transaction->save();
        }
        
        // If status changed to successful, credit user's wallet
        if ($oldStatus !== 'successful' && $newStatus === 'successful') {
            $user = User::find($airtimeToCash->user_id);
            if ($user) {
                $user->wallet_balance += $airtimeToCash->amount_to_receive;
                $user->save();
            }
        }
        
        // If status was successful but now changed to something else, deduct from user's wallet
        if ($oldStatus === 'successful' && $newStatus !== 'successful') {
            $user = User::find($airtimeToCash->user_id);
            if ($user && $user->wallet_balance >= $airtimeToCash->amount_to_receive) {
                $user->wallet_balance -= $airtimeToCash->amount_to_receive;
                $user->save();
            }
        }
        
        return redirect()->route('admin.airtime-to-cash.show', $airtimeToCash)
            ->with('success', 'Airtime to cash request status updated successfully.');
    }
}
