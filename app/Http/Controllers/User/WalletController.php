<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WalletFunding;
use App\Models\PaymentMethod;
use App\Models\Setting;
use App\Services\MonnifyService;
use App\Services\PaystackService;
use App\Services\XixatPayService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Uid\Ulid;

class WalletController extends Controller
{
    /**
     * Display the wallet page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        // Get all active payment methods
        $allPaymentMethods = PaymentMethod::where('is_active', true)->get();

        // Filter payment methods - Paystack and Monnify only for online payments
        $paymentMethods = $allPaymentMethods->map(function ($method) {
            if (in_array(strtolower($method->name), ['paystack', 'monnify'])) {
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

        // Get payment charges
        $paymentCharges = [
            'virtual_bank_deposit_charge' => (float) Setting::get('virtual_bank_deposit_charge', 0),
            'card_payment_charge' => (float) Setting::get('card_payment_charge', 0),
            'online_payment_charge' => (float) Setting::get('online_payment_charge', 0),
        ];

        return Inertia::render('User/Wallet', [
            'paymentMethods' => $paymentMethods,
            'recentTransactions' => $recentTransactions,
            'walletStats' => $walletStats,
            'virtualAccounts' => $user->virtual_account_details,
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
            $monnifyService = app(PaystackService::class);
            $paymentDescription = ['message' => 'Wallet Funding of ₦' . $request->amount];
            $redirectUrl = route('wallet.verify', ['reference' => $reference, 'gateway' => 'paystack']);
            $response = $monnifyService->initializeTransaction(
                $request->amount,
                $user->email,
                $reference,
                // $user->name,
                $redirectUrl,
                $paymentDescription
            );
            // \Log::info('Paystack Reference:', ['reference' => json_encode($response)]);

            // $response = $monnifyService->initializeTransaction($request->)
            if ($response['success']) {
                // Store checkout URL in wallet funding response data
                $walletFunding->response_data = array_merge($walletFunding->response_data ?? [], [
                    'checkout_url' => $response['data']['authorization_url'] ?? null,
                ]);
                $walletFunding->save();

                // Redirect to Monnify checkout page
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

        $walletFunding = WalletFunding::where('reference', $reference)->first();

        if (!$walletFunding) {
            return redirect()->route('wallet')->with('error', 'Invalid payment reference');
        }

        // If already processed, return success
        if ($walletFunding->status === 'successful') {
            return redirect()->route('wallet')->with('success', 'Payment was successful');
        }

        // Verify payment based on the gateway
        if ($gateway === 'paystack') {
            $monnifyService = app(PaystackService::class);
            $response = $monnifyService->verifyTransaction($reference);
        } else {
            return redirect()->route('wallet')->with('error', 'Invalid payment gateway');
        }

        if ($response['success']) {
            $paymentStatus = $response['status'];

            if ($paymentStatus === 'successful') {
                // Update wallet funding status
                $walletFunding->status = 'successful';

                // Calculate fee based on charge percentage
                $chargePercentage = $walletFunding->response_data['charge_percentage'] ?? Setting::get('online_payment_charge', 3);
                $fee = ($walletFunding->amount * $chargePercentage) / 100;
                $walletFunding->fee = $fee;
                // response_data is already cast to array by the model, so no need to json_decode
                $walletFunding->response_data = array_merge($walletFunding->response_data ?? [], [
                    'completed_at' => now(),
                    'payment_reference' => $response['data']['transactionReference'] ?? $response['data']['id'] ?? '',
                    'payment_method' => $response['data']['paymentMethod'] ?? $gateway,
                    'payment_details' => $response['data'],
                    'fee' => $fee,
                    'net_amount' => $walletFunding->amount - $fee,
                ]);
                $walletFunding->save();

                // Update transaction status
                $transaction = Transaction::where('reference', $reference)->first();
                if ($transaction) {
                    $transaction->status = 'successful';
                    $transaction->fee = $fee;
                    $transaction->save();
                }

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

                    // Send notification about the fee
                    if ($fee > 0) {
                        $notificationService = app(\App\Services\NotificationService::class);
                        $notificationService->sendSystemNotification(
                            $user,
                            'Wallet Funding Fee Applied',
                            "A service fee of ₦{$fee} ({$chargePercentage}%) has been deducted from your wallet funding of ₦{$walletFunding->amount}. Net amount credited: ₦{$netAmount}.",
                            'info'
                        );
                    }
                }

                return redirect()->route('wallet')->with('success', 'Payment was successful. Your wallet has been funded with ₦' . $walletFunding->amount);
            } elseif ($paymentStatus === 'pending') {
                return redirect()->route('wallet')->with('info', 'Your payment is still being processed. We will notify you once it is completed.');
            } else {
                return redirect()->route('wallet')->with('error', 'Payment failed. Please try again.');
            }
        } else {
            return redirect()->route('wallet')->with('error', 'Failed to verify payment: ' . ($response['message'] ?? 'Unknown error'));
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
        $provider = 'xixatpay'; // Only using XixaPay as the provider

        // Check if user already has a virtual account with XixaPay
        if (!empty($user->virtual_account_details[$provider])) {
            return redirect()->route('wallet')->with('info', 'You already have a  dedicated bank account.');
        }

        // Create virtual account with XixaPay
        $xixatPayService = app(XixatPayService::class);
        $response = $xixatPayService->createVirtualAccount($user);

        if ($response['success']) {
            // Store virtual account details in user's profile
            $virtualAccounts = $user->virtual_account_details ?? [];
            $virtualAccounts[$provider] = [
                'bank_name' => $response['data']['bank_name'],
                'account_number' => $response['data']['account_number'],
                'account_name' => $response['data']['account_name'],
                'reference' => $response['data']['reference'],
                'customer_id' => $response['data']['customer_id'],
                'all_accounts' => $response['data']['all_accounts'],
            ];
            $user->virtual_account_details = $virtualAccounts;
            $user->save();

            return redirect()->route('wallet')->with('success', '  dedicated bank account created successfully.');
        } else {
            return redirect()->route('wallet')->with('error', $response['message'] . 'Make Sure your email and phone number are valid');
        }
    }

    /**
     * Display the wallet transfer page.
     *
     * @return \Inertia\Response
     */
    public function showTransferPage()
    {
        return Inertia::render('User/WalletTransfer');
    }

    /**
     * Process wallet transfer to another user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'recipient_phone' => 'required|string|exists:users,phone_number',
            'amount' => 'required|numeric|min:100',
            'pin' => 'required|string|size:4',
        ]);

        $user = $request->user();

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $recipient = User::where('phone_number', $request->recipient_phone)->first();

        // Check if user is trying to transfer to themselves
        if ($user->id === $recipient->id) {
            return redirect()->back()->with('error', 'You cannot transfer to yourself.');
        }

        // Check if user has enough balance
        if ($user->wallet_balance < $request->amount) {
            return redirect()->back()->with('error', 'Insufficient wallet balance.');
        }

        // Generate unique reference
        $reference = 'TRAN' . strtoupper(Str::random(8));

        // Create transaction record for sender
        $senderTransaction = Transaction::create([
            'user_id' => $user->id,
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
            ],
        ]);

        // Create transaction record for recipient
        $recipientTransaction = Transaction::create([
            'user_id' => $recipient->id,
            'reference' => $reference,
            'type' => 'wallet_transfer',
            'amount' => $request->amount,
            'fee' => 0,
            'status' => 'successful',
            'recipient' => $recipient->phone_number,
            'description' => 'Wallet Transfer of ₦' . $request->amount . ' from ' . $user->name,
            'meta_data' => [
                'sender_id' => $user->id,
                'sender_name' => $user->name,
                'sender_phone' => $user->phone_number,
            ],
        ]);

        // Update wallet balances
        $user->wallet_balance -= $request->amount;
        $user->save();

        $recipient->wallet_balance += $request->amount;
        $recipient->save();

        return redirect()->route('wallet')->with('success', 'Wallet transfer of ₦' . $request->amount . ' to ' . $recipient->name . ' was successful.');
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
        ]);

        $user = $request->user();

        // Check if user has enough balance
        if ($user->wallet_balance < $request->amount) {
            return redirect()->back()->with('error', 'Insufficient wallet balance.');
        }

        // Generate unique reference
        $reference = 'WITH' . strtoupper(Str::random(8));

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
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
            ],
        ]);

        // Deduct from user's wallet
        $user->wallet_balance -= $request->amount;
        $user->save();

        return redirect()->route('wallet')->with('success', 'Withdrawal request of ₦' . $request->amount . ' has been submitted and is being processed.');
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
