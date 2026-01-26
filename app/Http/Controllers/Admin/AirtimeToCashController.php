<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AirtimeToCash;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AirtimeToCashController extends AtomicController
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

        // Cache lock to prevent concurrent admin actions on the same request
        $lock = \Illuminate\Support\Facades\Cache::lock('admin_a2c_update:' . $airtimeToCash->id, 10);
        
        if (!$lock->get()) {
            return redirect()->back()->with('error', 'This request is currently being updated by another administrator.');
        }

        try {
            DB::transaction(function () use ($request, $airtimeToCash) {
                // Lock the airtime to cash record first
                $lockedA2C = AirtimeToCash::where('id', $airtimeToCash->id)->lockForUpdate()->firstOrFail();
                $oldStatus = $lockedA2C->status;
                $newStatus = $request->status;

                if ($oldStatus === $newStatus) {
                    $lockedA2C->admin_note = $request->admin_note;
                    $lockedA2C->save();
                    return;
                }

                // If status changed to successful or from successful, we need to lock the user
                if (($oldStatus !== 'successful' && $newStatus === 'successful') || 
                    ($oldStatus === 'successful' && $newStatus !== 'successful')) {
                    
                    $user = User::where('id', $lockedA2C->user_id)->lockForUpdate()->firstOrFail();
                    
                    if ($newStatus === 'successful') {
                        $this->creditWallet($user, $lockedA2C->amount_to_receive, 'Airtime to Cash');
                    } else {
                        $this->deductWallet($user, $lockedA2C->amount_to_receive, 'Reverting Successful Airtime to Cash');
                    }
                }

                // Update airtime to cash record
                $lockedA2C->status = $newStatus;
                $lockedA2C->admin_note = $request->admin_note;
                $lockedA2C->save();

                // Update related transaction with lock
                $transaction = Transaction::where('reference', $lockedA2C->reference)->lockForUpdate()->first();
                if ($transaction) {
                    $transaction->status = $newStatus;
                    
                    if ($newStatus === 'successful') {
                        $transaction->profit = $lockedA2C->fee;
                        
                        // Record system profit
                        $this->recordSystemProfit(
                            $transaction, 
                            $lockedA2C->fee, 
                            'airtime_to_cash', 
                            null, 
                            "Profit from Airtime to Cash conversion: {$lockedA2C->reference}"
                        );
                    }
                    
                    $transaction->save();
                }
            });

            return redirect()->route('admin.airtime-to-cash.show', $airtimeToCash)
                ->with('success', 'Airtime to cash request status updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error updating status: ' . $e->getMessage());
        } finally {
            $lock->release();
        }
    }
}
