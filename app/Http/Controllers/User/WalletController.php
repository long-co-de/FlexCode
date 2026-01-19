<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WalletFunding;
use App\Models\PaymentMethod;
use App\Models\Setting;
use App\Services\PaystackService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Uid\Ulid;

class WalletController extends AtomicController
{
    /**
     * Display the wallet page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = Auth::user();
        // Get all active payment methods
        $allPaymentMethods = PaymentMethod::where('is_active', true)->get();

        // Filter payment methods - Paystack only for online payments
        $paymentMethods = $allPaymentMethods->map(function ($method) {
            if (in_array(strtolower($method->name), ['paystack'])) {
                $method->category = 'online_payment';
            } else {
                $method->category = 'bank_transfer';
            }
            return $method;
        });

        // Get recent wallet transactions
        $recentTransactions = Transaction::where('user_id', $user->id)
            ->whereIn('type', ['wallet_funding', 'wallet_transfer', 'commission'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Get wallet statistics
        $walletStats = [
            'total_funded' => Transaction::where('user_id', $user->id)
                ->where('type', 'wallet_funding')
                ->where('status', 'successful')
                ->sum('amount'),
            'total_spent' => Transaction::where('user_id', $user->id)
                ->whereNotIn('type', ['wallet_funding', 'wallet_transfer', 'commission'])
                ->where('status', 'successful')
                ->sum('amount'),
            'total_commission' => Transaction::where('user_id', $user->id)
                ->where('type', 'commission')
                ->where('status', 'successful')
                ->sum('amount'),
        ];
        $walletStats['total_spent'] = $walletStats['total_spent'] < 999999 ? number_format($walletStats['total_spent'] / 999, 2) . 'K' : number_format($walletStats['total_funded'] / 999999) . 'M';

        $walletStats['total_funded'] = $walletStats['total_funded'] < 999999 ? number_format($walletStats['total_funded'] / 999, 2) . 'K' : number_format($walletStats['total_funded'] / 999999) . 'M';
        // Initialize empty virtual account details if not set
        if (empty($user->virtual_account_details)) {
            $user->virtual_account_details = [];
            $user->save();
        }

        // Get payment charges - updated to new rules
        $paymentCharges = [
            'virtual_bank_deposit_charge' => 1.5,
            'card_payment_charge' => 1.5,
            'online_payment_charge' => 1.5,
        ];

        return Inertia::render('User/Wallet', [
            'paymentMethods' => $paymentMethods,
            'recentTransactions' => $recentTransactions,
            'walletStats' => $walletStats,
            'virtualAccounts' => array_values($user->virtual_account_details ?? []),
            'paymentCharges' => $paymentCharges,
            'has_card' => $user->cards()->exists(),
        ]);
    }

    /**
     * Process wallet funding.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function fund(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'payment_method_id' => 'required|exists:payment_methods,id',
        ]);

        $user = $request->user();
        $paymentMethod = PaymentMethod::findOrFail($request->payment_method_id);


        $reference = 'fund' . strtolower(Str::random(20));


        // Get the appropriate charge percentage based on payment method
        $chargePercentage = 0;

        // First check if there's a specific charge for this payment method in the wallet_funding_charges table
        $specificCharge = \App\Models\WalletFundingCharge::where('payment_method', $paymentMethod->name)
            ->where('is_active', true)
            ->first();

        if ($specificCharge) {
            $chargePercentage = $specificCharge->percentage;
        } else {
            // If no specific charge, use the general settings based on payment method type
            if ($paymentMethod->code === 'bank_transfer' || $paymentMethod->code === 'virtual_account') {
                $chargePercentage = (float) Setting::get('virtual_bank_deposit_charge', 0);
            } elseif ($paymentMethod->code === 'card') {
                $chargePercentage = (float) Setting::get('card_payment_charge', 0);
            } else {
                $chargePercentage = (float) Setting::get('online_payment_charge', 0);
            }
        }

        // Create wallet funding record
        $walletFunding = WalletFunding::create([
            'user_id' => $user->id,
            'payment_method_id' => $paymentMethod->id,
            'reference' => $reference,
            'amount' => $request->amount,
            'status' => 'pending',
            'fee' => 0, // Fee will be calculated after successful payment
            'response_data' => [
                'payment_method_id' => $paymentMethod->id,
                'payment_method_name' => $paymentMethod->name,
                'charge_percentage' => $chargePercentage,
                'initiated_at' => now(),
            ],
        ]);

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'wallet_funding',
            'amount' => $request->amount,
            'fee' => 0, // Fee will be calculated after successful payment
            'status' => 'pending',
            'recipient' => $user->email,
            'description' => 'Wallet Funding of ₦' . $request->amount . ' via ' . $paymentMethod->name,
            'meta_data' => [
                'payment_method' => $paymentMethod->name,
                'wallet_funding_id' => $walletFunding->id,
                'charge_percentage' => $chargePercentage,
            ],
        ]);

        // Process payment based on the payment method
        if ($paymentMethod->code === 'paystack') {
            $paystackService = app(PaystackService::class);
            $paymentDescription = ['message' => 'Wallet Funding of ₦' . $request->amount];
            $redirectUrl = route('wallet.verify', ['reference' => $reference, 'gateway' => 'paystack']);
            $response = $paystackService->initializeTransaction(
                $request->amount,
                $user->email,
                $reference,
                // $user->name,
                $redirectUrl,
                $paymentDescription
            );
            // \Log::info('Paystack Reference:', ['reference' => json_encode($response)]);

            // $response = $paystackService->initializeTransaction($request->)
            if ($response['success']) {
                // Store checkout URL in wallet funding response data
                $walletFunding->response_data = array_merge($walletFunding->response_data ?? [], [
                    'checkout_url' => $response['data']['authorization_url'] ?? null,
                ]);
                $walletFunding->save();

                // Redirect to Paystack checkout page
                return back()->withErrors(['url' => $response['data']['authorization_url']]);
            } else {
                return redirect()->route('wallet')->with('error', 'Failed to initialize payment: ' . ($response['message'] ?? 'Unknown error'));
            }
        } else {
            // For other payment methods or for testing, simulate a successful payment

            // Update wallet funding status
            // $walletFunding->status = 'successful';

            // // Calculate fee based on charge percentage
            // $chargePercentage = $walletFunding->response_data['charge_percentage'] ?? 0;
            // $fee = ($walletFunding->amount * $chargePercentage) / 100;
            // $walletFunding->fee = $fee;
            // $netAmount = $walletFunding->amount - $fee;

            // $walletFunding->response_data = array_merge($walletFunding->response_data??[], [
            //     'completed_at' => now(),
            //     'payment_reference' => 'PAY' . strtoupper(Str::random(12)),
            //     'fee' => $fee,
            //     'net_amount' => $netAmount,
            // ]);
            // $walletFunding->save();

            // // Update transaction status
            // $transaction->status = 'successful';
            // $transaction->fee = $fee;
            // $transaction->save();

            // // Update user's wallet balance (deduct the fee)
            // $user->wallet_balance += $netAmount;
            // $user->save();

            // // Send notification about the fee
            // if ($fee > 0) {
            //     $notificationService = app(\App\Services\NotificationService::class);
            //     $notificationService->sendSystemNotification(
            //         $user,
            //         'Wallet Funding Fee Applied',
            //         "A service fee of ₦{$fee} ({$chargePercentage}%) has been deducted from your wallet funding of ₦{$walletFunding->amount}. Net amount credited: ₦{$netAmount}.",
            //         'info'
            //     );
            // }

            // return redirect()->route('wallet')->with('success', 'Wallet funded successfully with ₦' . $request->amount);
        }
    }

    /**
     * Verify wallet funding payment.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verifyPayment(Request $request)
    {
        $reference = $request->query('reference');
        $gateway = $request->query('gateway', 'monnify');

        if (!$reference) {
            return redirect()->route('wallet')->with('error', 'Invalid payment reference');
        }

        // Cache lock based on reference to prevent concurrent verification
        $lock = \Illuminate\Support\Facades\Cache::lock('payment_verification:' . $reference, 30);

        if (!$lock->get()) {
            return redirect()->route('wallet')->with('error', 'Payment verification is already in progress. Please wait.');
        }

        try {
            return DB::transaction(function () use ($reference, $gateway) {
                $walletFunding = WalletFunding::where('reference', $reference)
                    ->lockForUpdate()
                    ->first();

                if (!$walletFunding) {
                    throw new \Exception('Invalid payment reference');
                }

<<<<<<< HEAD
                // If already processed, return success
                if ($walletFunding->status === 'successful') {
                    return redirect()->route('wallet')->with('success', 'Payment was successful');
                }
=======
                // Update user's wallet balance (deduct the fee)
                $user = User::find($walletFunding->user_id);
                if ($user) {
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
                    
                    $user->wallet_balance += $remainingAmount;
                    $user->save();
>>>>>>> b91c65d43d1f7ef7d71cc968473e9664252c7d75

                // Verify payment based on the gateway
                if ($gateway === 'paystack') {
                    $paystackService = app(PaystackService::class);
                    $response = $paystackService->verifyTransaction($reference);
                } else {
                    throw new \Exception('Invalid payment gateway');
                }

                if ($response['success']) {
                    $paymentStatus = $response['status'];

                    if ($paymentStatus === 'successful') {
                        // Update wallet funding status
                        $walletFunding->status = 'successful';

                        // Calculate fee using Paystack service
                        $paystackService = app(PaystackService::class);
                        $amount = $walletFunding->amount;
                        $fee = $paystackService->calculateServiceFee($amount);
                        $walletFunding->fee = $fee;

                        $walletFunding->response_data = array_merge($walletFunding->response_data ?? [], [
                            'completed_at' => now(),
                            'payment_reference' => $response['data']['transactionReference'] ?? $response['data']['id'] ?? '',
                            'payment_method' => $response['data']['paymentMethod'] ?? $gateway,
                            'payment_details' => $response['data'],
                            'fee' => $fee,
                            'net_amount' => $amount - $fee,
                        ]);
                        $walletFunding->save();

                        // Update transaction status
                        $transaction = Transaction::where('reference', $reference)->lockForUpdate()->first();
                        if ($transaction) {
                            $transaction->status = 'successful';
                            $transaction->fee = $fee;
                            $transaction->save();
                        }

                        // Update user's wallet balance (deduct the fee)
                        $user = User::where('id', $walletFunding->user_id)->lockForUpdate()->first();
                        if ($user) {
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

                            $user->wallet_balance += $remainingAmount;
                            $user->save();

                            // Send notification about the fee
                            if ($fee > 0) {
                                $notificationService = app(\App\Services\NotificationService::class);
                                $chargePercent = ($fee / $walletFunding->amount) * 100;
                                $notificationService->sendSystemNotification(
                                    $user,
                                    'Wallet Funding Fee Applied',
                                    "A service fee of ₦{$fee} (" . number_format($chargePercent, 2) . "%) has been deducted from your wallet funding of ₦{$walletFunding->amount}. Net amount credited: ₦{$netAmount}.",
                                    'info'
                                );
                            }

                            // Process referral bonus
                            $referralService = app(\App\Services\ReferralService::class);
                            if ($transaction) {
                                $referralService->processReferralBonus($transaction);
                            }
                        }

                        return redirect()->route('wallet')->with('success', 'Wallet funded successfully with ₦' . number_format($netAmount, 2));
                    } elseif ($paymentStatus === 'pending') {
                        return redirect()->route('wallet')->with('info', 'Your payment is still being processed. We will notify you once it is completed.');
                    } else {
                        return redirect()->route('wallet')->with('error', 'Payment failed. Please try again.');
                    }
                } else {
                    return redirect()->route('wallet')->with('error', 'Failed to verify payment: ' . ($response['message'] ?? 'Unknown error'));
                }
            });
        } catch (\Exception $e) {
            \Log::error('Payment verification failed', [
                'reference' => $reference,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->route('wallet')->with('error', 'An error occurred during payment verification: ' . $e->getMessage());
        } finally {
            if (isset($lock)) {
                $lock->release();
            }
        }
    }

    /**
     * Create a dedicated virtual account for the user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function createVirtualAccount(Request $request)
    {
        $user = $request->user();
        $provider = 'paystack';

        // Check if user has phone number - required by Paystack
        if (empty($user->phone_number)) {
            return redirect()->route('profile.edit')->with('error', 'Please update your phone number in your profile before creating a dedicated bank account.');
        }
        Log::info('Creating virtual account for user ID: ' . json_encode($user));

        // Check if user already has a virtual account with Paystack
        if (!empty($user->virtual_account_details[$provider])) {
            return redirect()->route('wallet')->with('info', 'You already have a dedicated bank account.');
        }

        // Create virtual account with Paystack
        $paystackService = app(PaystackService::class);
        $response = $paystackService->createDedicatedAccount($user);

        if ($response['success']) {
            // Store virtual account details in user's profile
            $virtualAccounts = $user->virtual_account_details ?? [];
            $data = $response['data'];

            $virtualAccounts[$provider] = [
                'bank_name' => $data['bank']['name'] ?? 'Paystack Bank',
                'account_number' => $data['account_number'],
                'account_name' => $data['account_name'],
                'reference' => $data['customer']['customer_code'] ?? '',
                'customer_id' => $data['customer']['id'] ?? '',
                'all_accounts' => $data,
            ];
            $user->virtual_account_details = $virtualAccounts;
            $user->save();

            return redirect()->route('wallet')->with('success', 'Dedicated bank account created successfully.');
        } else {
            // If error is about phone number, redirect to profile update
            if (str_contains($response['message'], 'phone')) {
                return redirect()->route('profile.edit')->with('error', 'Please update your phone number in your profile before creating a dedicated bank account.');
            }
            return redirect()->route('wallet')->with('error', $response['message'] . '. Make sure your email and phone number are valid.');
        }
    }

    /**
     * Display the wallet transfer page.
     *
     * @return \Inertia\Response
     */
    public function showTransferPage()
    {
        return back()->with('info', 'Wallet transfer feature is currently under maintenance. Please try again later.');
        return Inertia::render('User/WalletTransfer');
    }

    /**
     * Process wallet transfer to another user with atomic transaction safety.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'recipient_phone' => 'required|string|exists:users,phone_number',
            'amount' => 'required|numeric|min:100|max:1000000',
            'pin' => 'required|string|size:4',
            'request_id' => 'required|string|min:20|max:100',
        ]);
        return back()->with('info', 'Wallet transfer feature is currently under maintenance. Please try again later.');

        $user = $request->user();

        // **SECURITY FIX 1: Check for duplicate request (prevents replay attacks)**
        if ($this->isDuplicateRequest($request->request_id, $user->id, 'wallet_transfer')) {
            return redirect()->back()->with('error', 'This transfer request was already processed. Please check your transaction history.');
        }

        // **SECURITY FIX 2: Rate limiting (prevents rapid-fire transactions)**
        if ($this->isRateLimited($user->id, 'wallet_transfer', maxAttempts: 5, decaySeconds: 60)) {
            return redirect()->back()->with('error', 'Too many transfer attempts. Please wait before trying again.');
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $recipient = User::where('phone_number', $request->recipient_phone)->first();

        // Check if user is trying to transfer to themselves
        if ($user->id === $recipient->id) {
            return redirect()->back()->with('error', 'You cannot transfer to yourself.');
        }

        // **SECURITY FIX 3: Use atomic transaction with row locking**
        try {
            $result = $this->processAtomicTransaction($user->id, $request->amount, function ($lockedUser) use ($request, $recipient) {

                // Re-verify PIN within transaction (defense against timing attacks)
                if (!Hash::check($request->pin, $lockedUser->pin)) {
                    throw new \Exception('Invalid PIN. Please try again.');
                }

                // Check recipient's wallet limit
                $maxWalletBalance = (float) Setting::get('max_wallet_balance', 1000000);
                if (($recipient->wallet_balance + $request->amount) > $maxWalletBalance) {
                    throw new \Exception('Recipient has reached maximum wallet limit.');
                }

                // Generate unique reference with timestamp
                $reference = 'TRAN' . strtoupper(Str::random(8)) . time();

                // Create transaction record for sender
                $senderTransaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference . '-S',
                    'type' => 'wallet_transfer',
                    'amount' => $request->amount,
                    'fee' => 0,
                    'status' => 'successful',
                    'recipient' => $recipient->phone_number,
                    'description' => 'Wallet Transfer of ₦' . $request->amount . ' to ' . $recipient->name,
                    'meta_data' => [
                        'recipient_id' => $recipient->id,
                        'recipient_name' => $recipient->name,
                        'recipient_phone' => $recipient->phone_number,
                        'request_id' => $request->request_id,
                        'ip_address' => $request->ip(),
                        'user_agent' => substr($request->userAgent(), 0, 255),
                    ],
                ]);

                // Create transaction record for recipient
                $recipientTransaction = Transaction::create([
                    'user_id' => $recipient->id,
                    'reference' => $reference . '-R',
                    'type' => 'wallet_transfer',
                    'amount' => $request->amount,
                    'fee' => 0,
                    'status' => 'successful',
                    'recipient' => $recipient->phone_number,
                    'description' => 'Wallet Transfer of ₦' . $request->amount . ' from ' . $lockedUser->name,
                    'meta_data' => [
                        'sender_id' => $lockedUser->id,
                        'sender_name' => $lockedUser->name,
                        'sender_phone' => $lockedUser->phone_number,
                        'request_id' => $request->request_id,
                        'related_transaction' => $senderTransaction->id,
                    ],
                ]);

                // **SECURITY FIX 4: Update balances atomically within transaction**
                // Deduct from sender
                $this->deductWallet($lockedUser, $request->amount, 'wallet transfer');

                // Credit to recipient (also acquire lock on recipient)
                DB::table('users')
                    ->where('id', $recipient->id)
                    ->lockForUpdate()
                    ->increment('wallet_balance', $request->amount);

                // Log transaction for audit trail
                $this->logAtomicTransaction($lockedUser->id, 'wallet_transfer', $request->amount, $request->request_id, [
                    'recipient_id' => $recipient->id,
                    'reference' => $reference,
                ]);

                return [
                    'transaction' => $senderTransaction,
                    'recipient' => $recipient,
                    'reference' => $reference,
                ];
            });

            // Send notifications outside of transaction lock
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->sendSystemNotification(
                $user,
                'Transfer Successful',
                "You have successfully transferred ₦{$request->amount} to {$result['recipient']->name}.",
                'success'
            );

            $notificationService->sendSystemNotification(
                $result['recipient'],
                'Wallet Credited',
                "You have received ₦{$request->amount} from {$user->name}.",
                'info'
            );

            return redirect()->route('wallet')->with('success', 'Wallet transfer of ₦' . $request->amount . ' to ' . $result['recipient']->name . ' was successful.');
        } catch (\Exception $e) {
            \Log::error('Wallet transfer failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'recipient_phone' => $request->recipient_phone,
                'amount' => $request->amount,
                'request_id' => $request->request_id,
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Process wallet withdrawal.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function withdraw(Request $request)
    {
        $minWithdrawalAmount = Setting::get('min_withdrawal_amount', 1000);

        $request->validate([
            'amount' => 'required|numeric|min:' . $minWithdrawalAmount,
            'bank_name' => 'required|string',
            'account_number' => 'required|string|size:10',
            'account_name' => 'required|string',
            'pin' => 'required|string|size:4',
            'request_id' => 'nullable|string',
        ]);

        $user = $request->user();

        // **SECURITY FIX 1: Check for duplicate request**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'withdrawal')) {
            return redirect()->back()->with('error', 'This withdrawal request is already being processed. Please wait.');
        }

        // **SECURITY FIX 2: Rate limiting**
        if ($this->isRateLimited($user->id, 'withdrawal')) {
            return redirect()->back()->with('error', 'Too many withdrawal attempts. Please wait before trying again.');
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        try {
            $this->processAtomicTransaction($user->id, $request->amount, function ($lockedUser) use ($request, $requestId) {

                // Generate unique reference
                $reference = 'WITH' . strtoupper(Str::random(10)) . time();

                // Create transaction record
                Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'withdrawal',
                    'amount' => $request->amount,
                    'fee' => 0,
                    'status' => 'pending',
                    'recipient' => $request->account_number,
                    'description' => 'Withdrawal of ₦' . $request->amount . ' to ' . $request->bank_name . ' - ' . $request->account_name,
                    'meta_data' => [
                        'bank_name' => $request->bank_name,
                        'account_number' => $request->account_number,
                        'account_name' => $request->account_name,
                        'request_id' => $requestId,
                    ],
                ]);

                // Deduct from wallet
                $this->deductWallet($lockedUser, $request->amount, 'withdrawal');

                return true;
            });

            return redirect()->route('wallet')->with('success', 'Withdrawal request of ₦' . $request->amount . ' has been submitted and is being processed.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display wallet transaction history.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function history(Request $request)
    {
        // Redirect to the new transactions page
        return redirect()->route('transactions');
    }
}
