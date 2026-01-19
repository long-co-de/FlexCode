<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\WalletFunding;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
                    
                    // Calculate fee using Paystack service
                    $paystackService = app(\App\Services\PaystackService::class);
                    $fee = $paystackService->calculateServiceFee($walletFunding->amount);
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
                // Get Paystack service for charge calculation
                $paystackService = app(\App\Services\PaystackService::class);
                
                // Get the channel/method from Paystack response
                $channel = $paymentData['authorization']['channel'] ?? null;
                
                // Calculate charges based on channel
                $chargeData = [];
                if ($channel === 'dedicated_nuban') {
                    $chargeData = $paystackService->calculateDedicatedAccountProfit($amount);
                    $fee = $chargeData['total_charges'];
                } else {
                    $fee = $paystackService->calculateServiceFee($amount);
                    $chargeData = ['channel' => $channel ?? 'online'];
                }
                
                $netAmount = $amount - $fee;
                
                if ($walletFunding) {
                    // Update existing wallet funding
                    $walletFunding->status = 'successful';
                    $walletFunding->amount = $amount;
                    $walletFunding->fee = $fee;
                    $walletFunding->response_data = array_merge($walletFunding->response_data ?? [], $paymentData, [
                        'channel' => $channel,
                        'fee' => $fee,
                        'net_amount' => $netAmount,
                    ]);
                    
                    // Store profit data in meta_data if dedicated account
                    if ($channel === 'dedicated_nuban') {
                        $walletFunding->meta_data = array_merge($walletFunding->meta_data ?? [], [
                            'channel' => 'dedicated_nuban',
                            'paystack_charge' => $chargeData['paystack_charge'],
                            'system_profit' => $chargeData['system_profit'],
                            'excess_to_profit' => $chargeData['excess_charge_to_profit'],
                            'total_charges' => $fee,
                            'net_amount' => $netAmount,
                        ]);
                    }
                    
                    $walletFunding->save();
                    $user = $walletFunding->user;
                } else {
                    // Create new wallet funding from Paystack verification
                    $customerEmail = $paymentData['customer']['email'] ?? null;
                    $user = User::where('email', $customerEmail)->first();

                    if (!$user) {
                        throw new \Exception('User with email ' . $customerEmail . ' not found');
                    }

                    // Build meta_data with charge details
                    $metaData = ['channel' => $channel];
                    if ($channel === 'dedicated_nuban') {
                        $metaData['paystack_charge'] = $chargeData['paystack_charge'];
                        $metaData['system_profit'] = $chargeData['system_profit'];
                        $metaData['excess_to_profit'] = $chargeData['excess_charge_to_profit'];
                    }
                    $metaData['total_charges'] = $fee;
                    $metaData['net_amount'] = $netAmount;

                    $walletFunding = WalletFunding::create([
                        'user_id' => $user->id,
                        'reference' => $validated['reference'],
                        'amount' => $amount,
                        'payment_method' => 'paystack',
                        'status' => 'successful',
                        'fee' => $fee,
                        'response_data' => array_merge($paymentData, [
                            'channel' => $channel,
                            'fee' => $fee,
                            'net_amount' => $netAmount,
                        ]),
                        'meta_data' => $metaData,
                    ]);
                }

                // Update transaction
                $transactionMetaData = [
                    'admin_verified' => true,
                    'channel' => $channel,
                    'fees' => $fee,
                ];
                
                if ($channel === 'dedicated_nuban') {
                    $transactionMetaData['paystack_charge'] = $chargeData['paystack_charge'];
                    $transactionMetaData['system_profit'] = $chargeData['system_profit'];
                    $transactionMetaData['excess_to_profit'] = $chargeData['excess_charge_to_profit'];
                }
                
                $transaction = Transaction::where('reference', $validated['reference'])->lockForUpdate()->first();
                if ($transaction) {
                    $transaction->status = 'successful';
                    $transaction->fee = $fee;
                    $transaction->meta_data = array_merge($transaction->meta_data ?? [], $transactionMetaData);
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
                        'meta_data' => $transactionMetaData,
                    ]);
                }

                // Credit user wallet with net amount after fees
                $remainingAmount = $netAmount;

                // Settle outstanding debts first
                $borrowingService = app(\App\Services\BorrowingService::class);
                $debtRemaining = $borrowingService->settleDebts($user, $netAmount);
                $settledAmount = $netAmount - $debtRemaining;
                $remainingAmount = $debtRemaining;

                if ($settledAmount > 0) {
                    Log::info('Debt settled', [
                        'user_id' => $user->id,
                        'amount' => $settledAmount,
                        'method' => 'admin_payment_retrieval'
                    ]);
                }

                // Update user wallet
                $user->wallet_balance += $remainingAmount;
                $user->save();

                // Send notification with fee details if applicable
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationMessage = "Your Paystack payment of ₦" . number_format($amount, 2) . " (Reference: {$validated['reference']}) has been successfully verified and processed by an administrator.";
                
                if ($fee > 0) {
                    $notificationMessage .= " Service fee of ₦" . number_format($fee, 2) . " was deducted. ";
                }
                
                $notificationMessage .= "₦" . number_format($remainingAmount, 2) . " has been credited to your wallet.";
                
                $notificationService->sendSystemNotification(
                    $user,
                    'Payment Retrieved and Processed',
                    $notificationMessage,
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
            Log::error('Admin payment retrieval failed', [
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