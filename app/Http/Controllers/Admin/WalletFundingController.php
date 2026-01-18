<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\WalletFunding;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class WalletFundingController extends AtomicController
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

        // Cache lock to prevent concurrent updates on the same funding record
        $lockKey = 'admin_wallet_funding_lock_' . $walletFunding->id;
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 10);
        
        if (!$lock->get()) {
            return redirect()->back()->with('error', 'This record is currently being updated by another process.');
        }
        
        try {
            DB::transaction(function () use ($request, $walletFunding) {
                // Lock the wallet funding record
                $walletFunding = WalletFunding::where('id', $walletFunding->id)->lockForUpdate()->firstOrFail();
                
                $oldStatus = $walletFunding->status;
                $newStatus = $request->status;
                
                if ($oldStatus !== 'pending') {
                    throw new \Exception('This funding request is no longer pending.');
                }

                // Update wallet funding status
                $walletFunding->status = $newStatus;
                
                // If marking as successful, update user's wallet balance
                if ($newStatus === 'successful') {
                    $user = User::where('id', $walletFunding->user_id)->lockForUpdate()->firstOrFail();
                    
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
                    
                    // Settle outstanding debts first
                    $borrowingService = app(\App\Services\BorrowingService::class);
                    $remainingAmount = $borrowingService->settleDebts($user, $netAmount);
                    
                    if ($remainingAmount < $netAmount) {
                        $settledAmount = $netAmount - $remainingAmount;
                        $notificationService = app(\App\Services\NotificationService::class);
                        $notificationService->sendSystemNotification(
                            $user,
                            'Debt Automatically Settled',
                            "₦{$settledAmount} has been deducted from your funding to settle your outstanding debt.",
                            'info'
                        );
                    }
                    
                    // Credit the wallet safely
                    $this->creditWallet($user, $remainingAmount, 'Wallet Funding Approval');
                    
                    // Update related transaction if exists
                    $transaction = \App\Models\Transaction::where('reference', $walletFunding->reference)->lockForUpdate()->first();
                    if ($transaction) {
                        $transaction->status = 'successful';
                        $transaction->fee = $fee;
                        $transaction->save();
                    }
                }
                
                $walletFunding->save();
            });
            
            $lock->release();
            return redirect()->back()->with('success', 'Wallet funding status updated successfully.');
        } catch (\Exception $e) {
            $lock->release();
            return redirect()->back()->with('error', 'Error updating status: ' . $e->getMessage());
        }
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
            'request_id' => 'nullable|string',
        ]);
        
        $admin = auth()->user();

        // **SECURITY FIX: Deduplication for admin requests**
        $requestId = $request->request_id ?: $this->generateRequestId($admin->id);
        if ($this->isDuplicateRequest($requestId, $admin->id, 'admin_manual_funding')) {
            return redirect()->back()->with('error', 'This manual funding request is already being processed.');
        }

        try {
            DB::transaction(function () use ($request, $admin, $requestId) {
                $user = User::where('id', $request->user_id)->lockForUpdate()->firstOrFail();
                
                // Generate unique reference
                $reference = 'ADMIN_FUND_' . strtoupper(\Illuminate\Support\Str::random(8)) . time();
                
                // Create wallet funding record
                $walletFunding = WalletFunding::create([
                    'user_id' => $user->id,
                    'reference' => $reference,
                    'amount' => $request->amount,
                    'status' => 'successful',
                    'fee' => 0,
                    'response_data' => [
                        'admin_id' => $admin->id,
                        'admin_name' => $admin->name,
                        'description' => $request->description ?? 'Manual funding by admin',
                        'completed_at' => now(),
                        'payment_method' => 'System Funding',
                        'request_id' => $requestId,
                    ],
                ]);
                
                // Create transaction record
                \App\Models\Transaction::create([
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
                        'request_id' => $requestId,
                    ],
                ]);
                
                // Update user's wallet balance
                $amount = $request->amount;
                
                // Settle outstanding debts first
                $borrowingService = app(\App\Services\BorrowingService::class);
                $remainingAmount = $borrowingService->settleDebts($user, $amount);
                
                // Credit the wallet safely
                $this->creditWallet($user, $remainingAmount, 'Admin Manual Funding');
                
                // Send notification to user
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationService->sendSystemNotification(
                    $user,
                    'Wallet Funded by Admin',
                    "Your wallet has been credited with ₦{$request->amount} by an administrator.",
                    'success'
                );
            });
            
            $user = User::find($request->user_id);
            return redirect()->route('admin.wallet-fundings')->with('success', "Successfully funded {$user->name}'s wallet with ₦{$request->amount}");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Manual funding failed: ' . $e->getMessage());
        }
    }

    /**
     * Show the payment retrieval form for admin to verify and retrieve payment
     *
     * @return \Inertia\Response
     */
    public function showPaymentRetrievalForm()
    {
        return Inertia::render('Admin/WalletFundings/PaymentRetrieval');
    }

    /**
     * Verify and retrieve payment using Paystack reference
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyAndRetrievePayment(Request $request)
    {
        $validated = $request->validate([
            'reference' => 'required|string',
        ]);

        try {
            // Verify the payment using Paystack service
            $paystackService = app(\App\Services\PaystackService::class);
            $response = $paystackService->verifyTransaction($validated['reference']);

            if (!$response['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed: ' . ($response['message'] ?? 'Unknown error'),
                ], 400);
            }

            $paymentData = $response['data'];
            $amount = $paymentData['amount'] / 100; // Paystack returns amount in kobo

            // Check if payment is successful
            if ($paymentData['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment status is not successful',
                    'status' => $paymentData['status'],
                ], 400);
            }

            // Get or create wallet funding record
            $walletFunding = WalletFunding::where('reference', $validated['reference'])->first();

            if ($walletFunding && $walletFunding->status === 'successful') {
                return response()->json([
                    'success' => false,
                    'message' => 'This payment has already been processed',
                ], 400);
            }

            // Process the payment
            return DB::transaction(function () use ($walletFunding, $amount, $paymentData, $validated) {
                if ($walletFunding) {
                    // Update existing wallet funding
                    $walletFunding->status = 'successful';
                    $walletFunding->response_data = array_merge($walletFunding->response_data ?? [], $paymentData);
                    $walletFunding->save();
                    $user = $walletFunding->user;
                } else {
                    // Create new wallet funding from Paystack verification
                    $customerEmail = $paymentData['customer']['email'] ?? null;
                    $user = User::where('email', $customerEmail)->first();

                    if (!$user) {
                        throw new \Exception('User with email ' . $customerEmail . ' not found');
                    }

                    $walletFunding = WalletFunding::create([
                        'user_id' => $user->id,
                        'reference' => $validated['reference'],
                        'amount' => $amount,
                        'payment_method' => 'paystack',
                        'status' => 'successful',
                        'response_data' => $paymentData,
                        'fee' => 0, // Admin retrieval has no fee
                    ]);
                }

                // Calculate fee
                $fee = 0;
                $netAmount = $amount;

                // Update transaction
                $transaction = Transaction::where('reference', $validated['reference'])->lockForUpdate()->first();
                if ($transaction) {
                    $transaction->status = 'successful';
                    $transaction->fee = $fee;
                    $transaction->save();
                } else {
                    // Create transaction if it doesn't exist
                    $transaction = Transaction::create([
                        'user_id' => $user->id,
                        'reference' => $validated['reference'],
                        'amount' => $amount,
                        'fee' => $fee,
                        'type' => 'wallet_funding',
                        'status' => 'successful',
                        'payment_method' => 'paystack',
                        'metadata' => ['admin_verified' => true],
                    ]);
                }

                // Credit user wallet
                $remainingAmount = $amount;

                // Settle outstanding debts first
                $borrowingService = app(\App\Services\BorrowingService::class);
                $settledAmount = $amount - $borrowingService->settleDebts($user, $amount);
                $remainingAmount = $amount - $settledAmount;

                if ($settledAmount > 0) {
                    \Log::info('Debt settled', [
                        'user_id' => $user->id,
                        'amount' => $settledAmount,
                        'method' => 'admin_payment_retrieval'
                    ]);
                }

                // Update user wallet
                $user->wallet_balance += $remainingAmount;
                $user->save();

                // Send notification
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationService->sendSystemNotification(
                    $user,
                    'Payment Retrieved and Processed',
                    "Your Paystack payment of ₦{$amount} (Reference: {$validated['reference']}) has been successfully verified and processed by an administrator. ₦{$remainingAmount} has been credited to your wallet.",
                    'success'
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Payment verified and processed successfully',
                    'data' => [
                        'reference' => $validated['reference'],
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'amount' => $amount,
                        'fee' => $fee,
                        'net_amount' => $netAmount,
                        'settled_debt' => $settledAmount,
                        'credited_to_wallet' => $remainingAmount,
                    ],
                ]);
            });
        } catch (\Exception $e) {
            \Log::error('Admin payment retrieval failed', [
                'reference' => $validated['reference'] ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment retrieval failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}