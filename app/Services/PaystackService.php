<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use App\Models\User;
use App\Models\Transaction;
use App\Models\WalletFunding;
use App\Models\UserCard;
use App\Models\SystemProfit;
use Exception;

class PaystackService
{
    protected $secretKey;
    protected $publicKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secret_key') ?? Setting::where('key', 'paystack_secret_key')->value('value');
        $this->publicKey = config('services.paystack.public_key') ?? Setting::where('key', 'paystack_public_key')->value('value');
        $this->baseUrl = 'https://api.paystack.co';
    }

    /**
     * Calculate Paystack service fees based on amount and rules
     * 
     * Rules:
     * - 1.5% of the amount
     * - Plus ₦100 for amounts >= ₦2,000
     * 
     * @param float $amount The transaction amount in Naira
     * @return float The calculated service fee
     */
    public function calculateServiceFee($amount)
    {
        $fee = ($amount * 1.5) / 100;
        if ($amount >= 2000) {
            $fee += 100;
        }
        return $fee;
    }

    /**
     * Calculate dedicated virtual account charges and profit
     * 
     * For dedicated_nuban channel:
     * - Paystack charge: 1% (capped at 300)
     * - If 1% exceeds 300, the excess goes to system profit
     * - Base system profit: 0.5%
     * - Any excess from Paystack charge cap is added to system profit
     * 
     * @param float $amount The transaction amount in Naira
     * @return array Contains 'paystack_charge', 'system_profit', 'total_charges', 'net_amount'
     */
    public function calculateDedicatedAccountProfit($amount)
    {
        // Calculate 1% charge
        $onePercentCharge = ($amount * 1.0) / 100;
        
        // Paystack takes maximum of 300
        $paystackCharge = min($onePercentCharge, 300);
        
        // Any amount over 300 goes to system profit
        $excessCharge = max(0, $onePercentCharge - 300);
        
        // Base system profit is 0.5% plus any excess from Paystack cap
        $baseSystemProfit = ($amount * 0.5) / 100;
        $systemProfit = $baseSystemProfit + $excessCharge;
        
        // Total charges and net amount
        $totalCharges = $paystackCharge + $systemProfit;
        $netAmount = $amount - $totalCharges;

        return [
            'paystack_charge' => $paystackCharge,
            'paystack_charge_capped_at' => 300,
            'excess_charge_to_profit' => $excessCharge,
            'system_profit' => $systemProfit,
            'system_profit_base' => $baseSystemProfit,
            'total_charges' => $totalCharges,
            'net_amount' => $netAmount,
        ];
    }

    /**
     * Initialize payment transaction
     */
    public function initializeTransaction($amount, $email, $reference, $callbackUrl, $metadata = [])
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/transaction/initialize', [
                'amount' => $amount * 100, // Paystack amount is in kobo
                'email' => $email,
                'reference' => $reference,
                'callback_url' => $callbackUrl,
                'metadata' => $metadata,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                    'message' => 'Transaction initialized successfully',
                ];
            }

            Log::error('Paystack API Error: Failed to initialize transaction', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to initialize transaction',
            ];
        } catch (Exception $e) {
            Log::error('Paystack API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }

    /**
     * Verify transaction status
     */
    public function verifyTransaction($reference)
    {
        try {
            // disable ssl verification for this url or requested URL
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
                'verify' => false, // Disable SSL verification for this request only
            ])->get($this->baseUrl . '/transaction/verify/' . $reference);

            if ($response->successful()) {
                $data = $response->json()['data'] ?? [];
                $status = $data['status'] ?? '';

                return [
                    'success' => true,
                    'data' => $data,
                    'status' => $this->mapPaymentStatus($status),
                ];
            }

            Log::error('Paystack API Error: Failed to verify transaction', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to verify transaction',
            ];
        } catch (Exception $e) {
            Log::error('Paystack API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }

    /**
     * Verify card details and get authorization code
     */
    public function verifyCard($authorizationCode, $email)
    {
        try {
            // First, verify the authorization
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->get($this->baseUrl . '/transaction/verify/' . $authorizationCode);

            if ($response->successful()) {
                $data = $response->json()['data'] ?? [];

                // Check if transaction was successful
                if ($data['status'] === 'success' && isset($data['authorization'])) {
                    $authorization = $data['authorization'];

                    return [
                        'success' => true,
                        'data' => [
                            'authorization' => $authorization,
                            'card_type' => $authorization['card_type'] ?? 'unknown',
                            'last4' => $authorization['last4'] ?? '',
                            'exp_month' => $authorization['exp_month'] ?? '',
                            'exp_year' => $authorization['exp_year'] ?? '',
                            'bank' => $authorization['bank'] ?? 'Unknown Bank',
                            'reusable' => $authorization['reusable'] ?? false,
                        ],
                        'message' => 'Card verified successfully',
                    ];
                }
            }

            return [
                'success' => false,
                'message' => 'Card verification failed',
            ];
        } catch (Exception $e) {
            Log::error('Paystack Card Verification Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while verifying card',
            ];
        }
    }

    /**
     * Charge a saved card using authorization code
     */
    public function chargeAuthorization($authorizationCode, $amount, $email, $reason = 'Payment')
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/transaction/charge_authorization', [
                'authorization_code' => $authorizationCode,
                'email' => $email,
                'amount' => $amount * 100, // Convert to kobo
                'reference' => 'CHG_' . time() . '_' . uniqid(),
                'metadata' => [
                    'reason' => $reason,
                    'timestamp' => now()->toDateTimeString(),
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json()['data'] ?? [];

                if ($data['status'] === 'success') {
                    return [
                        'success' => true,
                        'data' => $data,
                        'message' => 'Payment successful',
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => $data['gateway_response'] ?? 'Payment failed',
                        'data' => $data,
                    ];
                }
            }

            Log::error('Paystack Charge Authorization Error', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to charge card',
            ];
        } catch (Exception $e) {
            Log::error('Paystack Charge Authorization Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while charging card',
            ];
        }
    }

    /**
     * Get list of transactions for a customer
     */
    public function getCustomerTransactions($customerCode)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->get($this->baseUrl . '/transaction', [
                'customer' => $customerCode,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to fetch transactions',
            ];
        } catch (Exception $e) {
            Log::error('Paystack Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred',
            ];
        }
    }

    /**
     * Create a customer on Paystack
     */
    public function createCustomer(User $user)
    {
        try {
            // Validate and format phone number
            $phone = $this->formatPhoneNumber($user->phone_number);

            Log::info('Paystack createCustomer - Raw phone', [
                'raw_phone' => $user->phone_number,
                'formatted_phone' => $phone,
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            if (!$phone) {
                return [
                    'success' => false,
                    'message' => 'Valid phone number is required. Please update your profile with a valid phone number.',
                ];
            }

            // Prepare the request payload
            $payload = [
                'email' => $user->email,
                'first_name' => explode(' ', $user->name)[0] ?? $user->name,
                'last_name' => explode(' ', $user->name)[1] ?? '',
                'phone' => $phone,
            ];

            Log::info('Paystack createCustomer - Request payload', $payload);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/customer', $payload);

            Log::info('Paystack createCustomer - Response status', [
                'status' => $response->status(),
                'successful' => $response->successful(),
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                Log::info('Paystack createCustomer - Success', [
                    'customer_code' => $responseData['data']['customer_code'] ?? null,
                    'customer_id' => $responseData['data']['id'] ?? null,
                ]);

                return [
                    'success' => true,
                    'data' => $responseData['data'] ?? [],
                ];
            }

            // Log the actual error from Paystack
            $errorData = $response->json();
            Log::error('Paystack Create Customer Error', [
                'response' => $errorData,
                'user_id' => $user->id,
                'phone' => $phone,
                'status_code' => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $errorData['message'] ?? 'Failed to create customer',
                'details' => $errorData['meta']['nextStep'] ?? null,
            ];
        } catch (Exception $e) {
            Log::error('Paystack Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'message' => 'An error occurred',
            ];
        }
    }

    public function createDedicatedAccount(User $user)
    {
        try {
            // First, ensure the user is a customer on Paystack
            $customerResponse = $this->createCustomer($user);
            if (!$customerResponse['success']) {
                return $customerResponse;
            }

            $customerCode = $customerResponse['data']['customer_code'];
            $customerId = $customerResponse['data']['id'] ?? null;

            Log::info('Paystack createDedicatedAccount - Starting', [
                'user_id' => $user->id,
                'customer_code' => $customerCode,
                'customer_id' => $customerId,
            ]);

            // Check if customer has phone number on Paystack
            $hasPhone = $this->checkCustomerPhone($customerCode);

            if (!$hasPhone) {
                Log::warning('Customer missing phone on Paystack, updating...');
                $phone = $this->formatPhoneNumber($user->phone_number);
                $updateResult = $this->updateCustomerPhone($customerCode, $phone);

                if (!$updateResult['success']) {
                    return [
                        'success' => false,
                        'message' => 'Could not update customer phone number on Paystack',
                    ];
                }

                // Verify update was successful
                sleep(1); // Small delay for update to propagate
                $hasPhone = $this->checkCustomerPhone($customerCode);

                if (!$hasPhone) {
                    return [
                        'success' => false,
                        'message' => 'Phone number update did not persist on Paystack',
                    ];
                }
            }

            // Prepare payload for dedicated account
            $payload = [
                'customer' => $customerCode,
            ];

            // Some banks might require additional parameters
            // You can specify preferred bank(s) if needed
            // $payload['preferred_bank'] = 'wema-bank';

            Log::info('Paystack createDedicatedAccount - Request payload', $payload);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->withoutVerifying()->post($this->baseUrl . '/dedicated_account', $payload);

            Log::info('Paystack createDedicatedAccount - Response status', [
                'status' => $response->status(),
                'successful' => $response->successful(),
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                Log::info('Paystack createDedicatedAccount - Success', [
                    'account_number' => $responseData['data']['account_number'] ?? null,
                    'bank_name' => $responseData['data']['bank']['name'] ?? null,
                ]);

                return [
                    'success' => true,
                    'data' => $responseData['data'] ?? [],
                ];
            }

            $errorData = $response->json();
            Log::error('Paystack API Error: Failed to create dedicated account', [
                'response' => $errorData,
                'user_id' => $user->id,
                'customer_code' => $customerCode,
                'payload' => $payload,
            ]);

            return [
                'success' => false,
                'message' => $errorData['message'] ?? 'Failed to create dedicated account',
                'details' => $errorData['meta']['nextStep'] ?? null,
            ];
        } catch (Exception $e) {
            Log::error('Paystack API Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }
    /**
     * Check if customer has phone number on Paystack
     */
    protected function checkCustomerPhone($customerCode)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->get($this->baseUrl . '/customer/' . $customerCode);

            if ($response->successful()) {
                $customerData = $response->json()['data'] ?? [];
                $hasPhone = !empty($customerData['phone']);

                Log::info('Customer phone check', [
                    'customer_code' => $customerCode,
                    'has_phone' => $hasPhone,
                    'phone_in_data' => $customerData['phone'] ?? 'none',
                ]);

                return $hasPhone;
            }

            return false;
        } catch (Exception $e) {
            Log::error('Check customer phone error: ' . $e->getMessage());
            return false;
        }
    }
    /**
     * Update customer phone number
     */
    protected function updateCustomerPhone($customerCode, $phone)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->put($this->baseUrl . '/customer/' . $customerCode, [
                'phone' => $phone,
            ]);

            if ($response->successful()) {
                Log::info('Customer phone updated successfully');
                return ['success' => true];
            }

            Log::error('Failed to update customer phone', [
                'response' => $response->json(),
            ]);
            return ['success' => false];
        } catch (Exception $e) {
            Log::error('Update customer phone error: ' . $e->getMessage());
            return ['success' => false];
        }
    }

    /**
     * Retry dedicated account creation
     */
    protected function retryDedicatedAccountCreation($customerCode, $originalPayload)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->withoutVerifying()->post($this->baseUrl . '/dedicated_account', $originalPayload);

            if ($response->successful()) {
                $responseData = $response->json();
                Log::info('Paystack retryDedicatedAccountCreation - Success');
                return [
                    'success' => true,
                    'data' => $responseData['data'] ?? [],
                ];
            }

            $errorData = $response->json();
            Log::error('Paystack retry failed', [
                'response' => $errorData,
            ]);

            return [
                'success' => false,
                'message' => $errorData['message'] ?? 'Failed to create dedicated account after retry',
            ];
        } catch (Exception $e) {
            Log::error('Retry error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Retry failed: ' . $e->getMessage(),
            ];
        }
    }

    protected function formatPhoneNumber($phone)
    {
        Log::info('formatPhoneNumber - Input', ['input' => $phone]);

        if (empty($phone)) {
            Log::warning('formatPhoneNumber - Empty phone');
            return null;
        }

        // Remove any non-digit characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        Log::info('formatPhoneNumber - After regex', ['phone' => $phone]);

        if (empty($phone)) {
            Log::warning('formatPhoneNumber - Empty after regex');
            return null;
        }

        // If phone starts with 0, convert to +234
        if (strlen($phone) === 11 && str_starts_with($phone, '0')) {
            $formatted = '+234' . substr($phone, 1);
            Log::info('formatPhoneNumber - Case 1', ['formatted' => $formatted]);
            return $formatted;
        }
        // If phone is 10 digits (without leading 0), add +234
        elseif (strlen($phone) === 10) {
            $formatted = '+234' . $phone;
            Log::info('formatPhoneNumber - Case 2', ['formatted' => $formatted]);
            return $formatted;
        }
        // If phone already has country code but no +
        elseif (strlen($phone) === 13 && str_starts_with($phone, '234')) {
            $formatted = '+' . $phone;
            Log::info('formatPhoneNumber - Case 3', ['formatted' => $formatted]);
            return $formatted;
        }
        // If phone already has + and looks valid
        elseif (str_starts_with($phone, '+') && strlen($phone) === 14) {
            Log::info('formatPhoneNumber - Case 4 - Already formatted', ['formatted' => $phone]);
            return $phone;
        }
        // Default: try to format as Nigerian number
        else {
            // Check if it starts with 234 and is 13 digits
            if (str_starts_with($phone, '234') && strlen($phone) === 13) {
                $formatted = '+' . $phone;
            } else {
                // Try to add +234 prefix
                $formatted = '+234' . ltrim($phone, '0');
            }

            Log::info('formatPhoneNumber - Case 5 - Default formatting', [
                'original' => $phone,
                'formatted' => $formatted,
                'length' => strlen($formatted),
            ]);

            return $formatted;
        }
    }
    /**
     * Map Paystack payment status to application status
     */

    protected function mapPaymentStatus($paystackStatus)
    {
        switch ($paystackStatus) {
            case 'success':
                return 'successful';
            case 'pending':
                return 'pending';
            case 'failed':
                return 'failed';
            default:
                return 'pending';
        }
    }

    /**
     * Process webhook notification from Paystack
     */
    public function processWebhook($payload)
    {
        try {
            $event = $payload['event'] ?? '';
            $data = $payload['data'] ?? [];

            switch ($event) {
                case 'charge.success':
                    return $this->processSuccessfulCharge($data);
                case 'transfer.success':
                    return $this->processSuccessfulTransfer($data);
                case 'subscription.create':
                    return $this->processSubscriptionCreate($data);
                default:
                    Log::info('Unhandled Paystack Webhook Event: ' . $event, $data);
                    return [
                        'success' => true,
                        'message' => 'Event type not handled: ' . $event,
                    ];
            }
        } catch (Exception $e) {
            Log::error('Paystack Webhook Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while processing webhook',
            ];
        }
    }

    /**
     * Process successful charge webhook
     */
    protected function processSuccessfulCharge($data)
    {
        $reference = $data['reference'] ?? '';
        $amount = ($data['amount'] ?? 0) / 100; // Convert from kobo to naira
        $status = $data['status'] ?? '';
        $authorization = $data['authorization'] ?? null;
        $channel = $data['channel'] ?? '';

        if (empty($reference) || $status !== 'success') {
            return [
                'success' => false,
                'message' => 'Invalid transaction data',
            ];
        }

        // Handle dedicated virtual account transactions
        if ($channel === 'dedicated_nuban') {
            return $this->processDedicatedAccountTransaction($amount, $data);
        }

        // Handle different transaction types
        if (str_starts_with($reference, 'BOR_')) {
            // Borrowing repayment
            return $this->processBorrowingRepayment($reference, $amount, $data);
        } elseif (str_starts_with($reference, 'CHG_')) {
            // Card charge
            return $this->processCardCharge($reference, $amount, $data);
        } else {
            // Wallet funding
            return $this->processWalletFunding($reference, $amount, $data);
        }
    }

    /**
     * Process wallet funding transaction with atomic safety
     */
    protected function processWalletFunding($reference, $amount, $data)
    {
        $lock = \Illuminate\Support\Facades\Cache::lock('paystack_webhook:' . $reference, 30);

        if (!$lock->get()) {
            return [
                'success' => false,
                'message' => 'Transaction is currently being processed by another worker',
            ];
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($reference, $amount, $data) {
                $walletFunding = WalletFunding::where('reference', $reference)
                    ->lockForUpdate()
                    ->first();

                if (!$walletFunding) {
                    return [
                        'success' => false,
                        'message' => 'Wallet funding record not found',
                    ];
                }

                if ($walletFunding->status === 'successful') {
                    return [
                        'success' => true,
                        'message' => 'Transaction already processed',
                    ];
                }

                // Calculate fee using the service fee calculator
                $fee = $this->calculateServiceFee($amount);
                $netAmount = $amount - $fee;

                // Update wallet funding status
                $walletFunding->status = 'successful';
                $walletFunding->fee = $fee;
                $walletFunding->response_data = array_merge($walletFunding->response_data ?? [], [
                    'completed_at' => now(),
                    'payment_reference' => $data['id'] ?? '',
                    'payment_method' => 'paystack',
                    'payment_details' => $data,
                    'fee' => $fee,
                    'net_amount' => $netAmount,
                ]);
                $walletFunding->save();

                // Update transaction status
                $transaction = Transaction::where('reference', $reference)->lockForUpdate()->first();
                if ($transaction) {
                    $transaction->status = 'successful';
                    $transaction->fee = $fee;
                    $transaction->save();
                }

                // Credit user wallet with debt settlement
                $user = User::where('id', $walletFunding->user_id)->lockForUpdate()->first();
                if ($user) {
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

                    // Calculate and record system profit (5% of deposit amount)
                    $profitPercentage = 5.00; // Fixed 5% profit for all wallet deposits
                    $profitAmount = ($amount * $profitPercentage) / 100;
                    
                    // Create system profit record
                    SystemProfit::create([
                        'user_id' => $user->id,
                        'transaction_id' => $transaction->id,
                        'wallet_funding_id' => $walletFunding->id,
                        'profit_source' => 'paystack_wallet_deposit',
                        'amount' => $amount,
                        'profit_percentage' => $profitPercentage,
                        'profit_amount' => $profitAmount,
                        'status' => 'recorded',
                        'description' => "5% profit from Paystack wallet deposit of ₦{$amount}",
                        'meta_data' => [
                            'payment_reference' => $reference,
                            'payment_method' => 'paystack',
                            'fee' => $fee,
                            'net_amount' => $netAmount,
                        ],
                    ]);

                    // Process referral bonus
                    $referralService = app(\App\Services\ReferralService::class);
                    if ($transaction) {
                        $referralService->processReferralBonus($transaction);
                    }
                }

                return [
                    'success' => true,
                    'message' => 'Wallet funding processed successfully',
                ];
            });
        } catch (\Exception $e) {
            Log::error('Paystack processWalletFunding failed: ' . $e->getMessage(), [
                'reference' => $reference,
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Internal error: ' . $e->getMessage(),
            ];
        } finally {
            $lock->release();
        }
    }

    /**
     * Process borrowing repayment
     */
    protected function processBorrowingRepayment($reference, $amount, $data)
    {
        // You'll need to implement this based on your borrowing system
        // This would update borrowing status and mark as paid

        Log::info('Borrowing repayment processed', [
            'reference' => $reference,
            'amount' => $amount,
            'data' => $data,
        ]);

        return [
            'success' => true,
            'message' => 'Borrowing repayment processed',
        ];
    }

    /**
     * Process dedicated virtual account transaction
     */
    protected function processDedicatedAccountTransaction($amount, $data)
    {
        $customer = $data['customer'] ?? [];
        $email = $customer['email'] ?? '';
        $reference = $data['reference'] ?? '';

        if (empty($email)) {
            return [
                'success' => false,
                'message' => 'Customer email not found in payload',
            ];
        }

        $lock = \Illuminate\Support\Facades\Cache::lock('paystack_virtual_acc:' . $reference, 30);

        if (!$lock->get()) {
            return [
                'success' => false,
                'message' => 'Transaction is currently being processed',
            ];
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($email, $amount, $reference, $data) {
                $user = User::where('email', $email)->lockForUpdate()->first();

                if (!$user) {
                    return [
                        'success' => false,
                        'message' => 'User not found for email: ' . $email,
                    ];
                }

                // Check if transaction already exists and is successful
                $existingTransaction = Transaction::where('reference', $reference)->first();
                if ($existingTransaction && $existingTransaction->status === 'successful') {
                    return [
                        'success' => true,
                        'message' => 'Transaction already processed',
                    ];
                }

                // Calculate charges and profit using the dedicated account calculator
                $profitData = $this->calculateDedicatedAccountProfit($amount);
                $paystackCharge = $profitData['paystack_charge'];
                $excessCharge = $profitData['excess_charge_to_profit'];
                $systemProfitAmount = $profitData['system_profit'];
                $systemProfitBase = $profitData['system_profit_base'];
                $totalCharges = $profitData['total_charges'];
                $netAmount = $profitData['net_amount'];

                // Create or update wallet funding record with profit details
                $paymentMethodId = \App\Models\PaymentMethod::where('name', 'LIKE', '%Paystack%')->value('id');

                $walletFunding = WalletFunding::updateOrCreate(
                    ['reference' => $reference],
                    [
                        'user_id' => $user->id,
                        'payment_method_id' => $paymentMethodId,
                        'amount' => $amount,
                        'fee' => $totalCharges,
                        'status' => 'successful',
                        'response_data' => array_merge($data, [
                            'completed_at' => now(),
                            'paystack_charge' => $paystackCharge,
                            'excess_charge_to_profit' => $excessCharge,
                            'system_profit' => $systemProfitAmount,
                            'system_profit_base' => $systemProfitBase,
                            'total_charges' => $totalCharges,
                            'net_amount' => $netAmount,
                            'type' => 'dedicated_virtual_account',
                            'channel' => 'dedicated_nuban',
                        ]),
                        'meta_data' => [
                            'channel' => 'dedicated_nuban',
                            'paystack_charge' => $paystackCharge,
                            'paystack_charge_percentage' => 1.0,
                            'paystack_charge_cap' => 300,
                            'excess_charge_to_profit' => $excessCharge,
                            'system_profit_base' => $systemProfitBase,
                            'system_profit_base_percentage' => 0.5,
                            'system_profit_total' => $systemProfitAmount,
                            'total_charges' => $totalCharges,
                            'net_amount' => $netAmount,
                            'profit_recorded' => true,
                            'completed_at' => now()->toIso8601String(),
                        ],
                    ]
                );

                // Create or update transaction record
                $transaction = Transaction::updateOrCreate(
                    ['reference' => $reference],
                    [
                        'user_id' => $user->id,
                        'type' => 'wallet_funding',
                        'amount' => $amount,
                        'fee' => $totalCharges,
                        'status' => 'successful',
                        'recipient' => $user->email,
                        'description' => 'Dedicated Virtual Account Funding of ₦' . number_format($amount, 2),
                        'meta_data' => [
                            'payment_method' => 'paystack_virtual_account',
                            'channel' => 'dedicated_nuban',
                            'paystack_charge' => $paystackCharge,
                            'paystack_charge_percentage' => 1.0,
                            'paystack_charge_cap' => 300,
                            'excess_charge_to_profit' => $excessCharge,
                            'system_profit_base' => $systemProfitBase,
                            'system_profit_base_percentage' => 0.5,
                            'system_profit_total' => $systemProfitAmount,
                            'total_charges' => $totalCharges,
                            'net_amount' => $netAmount,
                        ],
                    ]
                );

                // Settle outstanding debts first
                $borrowingService = app(\App\Services\BorrowingService::class);
                $remainingAmount = $borrowingService->settleDebts($user, $netAmount);

                if ($remainingAmount < $netAmount) {
                    $settledAmount = $netAmount - $remainingAmount;
                    $notificationService = app(\App\Services\NotificationService::class);
                    $notificationService->sendSystemNotification(
                        $user,
                        'Debt Automatically Settled',
                        "₦" . number_format($settledAmount, 2) . " has been deducted from your virtual account funding to settle your outstanding debt.",
                        'info'
                    );
                }

                $user->wallet_balance += $remainingAmount;
                $user->save();

                // Calculate and record system profit
                $systemProfitPercentage = 0.5;
                SystemProfit::create([
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'wallet_funding_id' => $walletFunding->id,
                    'profit_source' => 'paystack_virtual_account',
                    'amount' => $amount,
                    'profit_percentage' => $systemProfitPercentage + ($excessCharge / $amount * 100),
                    'profit_amount' => $systemProfitAmount,
                    'status' => 'recorded',
                    'description' => "System profit from Paystack dedicated virtual account deposit of ₦{$amount} (0.5% base + ₦" . number_format($excessCharge, 2) . " excess)",
                    'meta_data' => [
                        'payment_reference' => $reference,
                        'payment_method' => 'paystack',
                        'channel' => 'dedicated_nuban',
                        'paystack_charge' => $paystackCharge,
                        'paystack_charge_percentage' => 1.0,
                        'paystack_charge_cap' => 300,
                        'system_profit_base' => $systemProfitBase,
                        'system_profit_base_percentage' => $systemProfitPercentage,
                        'excess_charge_to_profit' => $excessCharge,
                        'system_profit_total' => $systemProfitAmount,
                        'system_profit_total_percentage' => ($systemProfitAmount / $amount * 100),
                        'net_amount' => $netAmount,
                    ],
                ]);

                // Process referral bonus
                $referralService = app(\App\Services\ReferralService::class);
                $referralService->processReferralBonus($transaction);

                return [
                    'success' => true,
                    'message' => 'Virtual account funding processed successfully',
                ];
            });
        } catch (\Exception $e) {
            Log::error('Paystack processDedicatedAccountTransaction failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Internal error: ' . $e->getMessage(),
            ];
        } finally {
            $lock->release();
        }
    }

    /**
     * Process card charge
     */
    protected function processCardCharge($reference, $amount, $data)
    {
        // Handle card charge webhook
        // Could be for various purposes - update relevant records

        Log::info('Card charge processed', [
            'reference' => $reference,
            'amount' => $amount,
            'data' => $data,
        ]);

        return [
            'success' => true,
            'message' => 'Card charge processed',
        ];
    }

    /**
     * Validate webhook signature
     */
    public function validateWebhookSignature($payload, $signature)
    {
        $computedSignature = hash_hmac('sha512', $payload, $this->secretKey);
        return hash_equals($computedSignature, $signature);
    }

    /**
     * Get banks list for transfers
     */
    public function getBanks()
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->get($this->baseUrl . '/bank');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to fetch banks',
            ];
        } catch (Exception $e) {
            Log::error('Paystack Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred',
            ];
        }
    }

    /**
     * Create transfer recipient
     */
    public function createTransferRecipient($accountNumber, $bankCode, $name)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/transferrecipient', [
                'type' => 'nuban',
                'name' => $name,
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
                'currency' => 'NGN',
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to create transfer recipient',
            ];
        } catch (Exception $e) {
            Log::error('Paystack Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred',
            ];
        }
    }

    /**
     * Initiate transfer
     */
    public function initiateTransfer($recipientCode, $amount, $reason)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/transfer', [
                'source' => 'balance',
                'reason' => $reason,
                'amount' => $amount * 100,
                'recipient' => $recipientCode,
                'reference' => 'TRF_' . time() . '_' . uniqid(),
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to initiate transfer',
            ];
        } catch (Exception $e) {
            Log::error('Paystack Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred',
            ];
        }
    }
}
