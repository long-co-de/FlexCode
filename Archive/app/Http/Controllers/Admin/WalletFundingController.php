<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\WalletFunding;
use App\Models\User;

class WalletFundingController extends Controller
{
    /**
     * Display a listing of wallet fundings.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = WalletFunding::with('user');
        
        // Apply filters if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }
        
        // Get paginated results
        $walletFundings = $query->orderBy('created_at', 'desc')
                               ->paginate(15)
                               ->withQueryString();
        
        // Get statistics
        $stats = [
            'total' => WalletFunding::count(),
            'successful' => WalletFunding::where('status', 'successful')->count(),
            'pending' => WalletFunding::where('status', 'pending')->count(),
            'failed' => WalletFunding::where('status', 'failed')->count(),
            'total_amount' => WalletFunding::where('status', 'successful')->sum('amount'),
            'total_fees' => WalletFunding::where('status', 'successful')->sum('fee'),
        ];
        
        // Get payment methods for filtering
        $paymentMethods = ['paystack','admin'];
        
        return Inertia::render('Admin/WalletFundings/Index', [
            'walletFundings' => $walletFundings,
            'stats' => $stats,
            'filters' => $request->only(['status', 'payment_method', 'search']),
            'paymentMethods' => $paymentMethods,
        ]);
    }
    
    /**
     * Display the specified wallet funding.
     *
     * @param  \App\Models\WalletFunding  $walletFunding
     * @return \Inertia\Response
     */
    public function show(WalletFunding $walletFunding)
    {
        $walletFunding->load('user');
        
        return Inertia::render('Admin/WalletFundings/Show', [
            'walletFunding' => $walletFunding,
        ]);
    }
    
    /**
     * Update the status of a wallet funding.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\WalletFunding  $walletFunding
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateStatus(Request $request, WalletFunding $walletFunding)
    {
        $request->validate([
            'status' => 'required|in:pending,successful,failed',
        ]);
        
        // Only allow status changes for pending wallet fundings
        if ($walletFunding->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending wallet fundings can be updated.');
        }
        
        $oldStatus = $walletFunding->status;
        $newStatus = $request->status;
        
        // Update wallet funding status
        $walletFunding->status = $newStatus;
        
        // If marking as successful, update user's wallet balance
        if ($newStatus === 'successful' && $oldStatus !== 'successful') {
            $user = User::find($walletFunding->user_id);
            
            if ($user) {
                // Calculate fee based on charge percentage
                $chargePercentage = $walletFunding->meta_data['charge_percentage'] ?? 0;
                $fee = ($walletFunding->amount * $chargePercentage) / 100;
                $walletFunding->fee = $fee;
                
                // Update meta data
                $walletFunding->meta_data = array_merge($walletFunding->meta_data ?? [], [
                    'completed_at' => now()->toIso8601String(),
                    'fee' => $fee,
                    'net_amount' => $walletFunding->amount - $fee,
                    'updated_by_admin' => auth()->id(),
                ]);
                
                // Update user's wallet balance
                $netAmount = $walletFunding->amount - $fee;
                $user->wallet_balance += $netAmount;
                $user->save();
                
                // Update related transaction if exists
                $transaction = \App\Models\Transaction::where('reference', $walletFunding->reference)->first();
                if ($transaction) {
                    $transaction->status = 'successful';
                    $transaction->fee = $fee;
                    $transaction->save();
                }
            }
        }
        
        $walletFunding->save();
        
        return redirect()->back()->with('success', 'Wallet funding status updated successfully.');
    }
    
    /**
     * Show form to manually fund a user's wallet.
     *
     * @return \Inertia\Response
     */
    public function showManualFundingForm()
    {
        $users = User::where('role', '!=', 'admin')->select('id', 'name', 'email', 'phone_number')->get();
        
        return Inertia::render('Admin/WalletFundings/ManualFunding', [
            'users' => $users,
        ]);
    }
    
    /**
     * Process manual wallet funding by admin.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function manualFunding(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:100',
            'description' => 'nullable|string|max:255',
        ]);
        
        $user = User::findOrFail($request->user_id);
        $admin = auth()->user();
        
        // Generate unique reference
        $reference = 'ADMIN_FUND_' . strtoupper(\Illuminate\Support\Str::random(8));
        
        // Create wallet funding record
        $walletFunding = WalletFunding::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'amount' => $request->amount,
            // 'payment_gateway' => 'Admin Manual Funding',
            'status' => 'successful',
            'fee' => 0, // No fee for admin funding
            'response_data' => [
                'admin_id' => $admin->id,
                'admin_name' => $admin->name,
                'description' => $request->description ?? 'Manual funding by admin',
                'completed_at' => now(),
                'payment_method'=>'System Funding'
            ],
        ]);
        
        // Create transaction record
        $transaction = \App\Models\Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'wallet_funding',
            'amount' => $request->amount,
            'fee' => 0,
            'status' => 'successful',
            'recipient' => $user->email,
            'description' => $request->description ?? 'Manual wallet funding by admin',
            'meta_data' => [
                'payment_method' => 'Admin Manual Funding',
                'wallet_funding_id' => $walletFunding->id,
                'admin_id' => $admin->id,
            ],
        ]);
        
        // Update user's wallet balance
        $user->wallet_balance += $request->amount;
        $user->save();
        
        // Send notification to user
        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->sendSystemNotification(
            $user,
            'Wallet Funded by Admin',
            "Your wallet has been credited with ₦{$request->amount} by an administrator.",
            'success'
        );
        
        return redirect()->route('admin.wallet-fundings')->with('success', "Successfully funded {$user->name}'s wallet with ₦{$request->amount}");
    }
}