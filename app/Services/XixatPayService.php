<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use App\Models\User;
use App\Models\Transaction;
use App\Models\WalletFunding;
use Exception;

class XixatPayService
{
    protected $apiKey;
    protected $secretKey;
    protected $baseUrl;
    protected $businessId;

    public function __construct()
    {
        $this->apiKey = Setting::where('key', 'xixapay_api_key')->value('value');
        $this->secretKey = Setting::where('key', 'xixapay_secret_key')->value('value');
        $this->baseUrl = Setting::where('key', 'xixapay_base_url')->value('value') ?? 'https://api.xixapay.com/api/v1';
        $this->businessId = Setting::where('key', 'xixapay_business_id')->value('value');
    }

    /**
     * Create a dedicated virtual account for a user
     *
     * @param User $user
     * @return array
     */
    public function createVirtualAccount(User $user)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/createVirtualAccount', [
                'email' => $user->email,
                'name' => $user->name,
                'phoneNumber' => $user->phone_number ?? '',
                'bankCode' => ["20867"], // Palmpay and WEMA bank codes
                'businessId' => $this->businessId,
            ]);

            if ($response->successful() && $response->json('status') === 'success') {
                $data = $response->json();
                
                // Extract the first bank account (or you can store all accounts)
                $bankAccount = $data['bankAccounts'][0] ?? null;
                
                if (!$bankAccount) {
                    return [
                        'success' => false,
                        'message' => 'No bank account was created',
                    ];
                }
                
                return [
                    'success' => true,
                    'data' => [
                        'bank_name' => $bankAccount['bankName'],
                        'account_number' => $bankAccount['accountNumber'],
                        'account_name' => 'Xixat Pay - ' . $bankAccount['accountName'],
                        'reference' => $bankAccount['Reserved_Account_Id'],
                        'customer_id' => $data['customer']['customer_id'] ?? '',
                        'all_accounts' => $data['bankAccounts'], // Store all accounts for reference
                    ],
                    'message' => 'Virtual account created successfully',
                ];
            }

            Log::error('XixaPay API Error: Failed to create virtual account', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'Failed to create virtual account',
            ];
        } catch (Exception $e) {
            Log::error('XixaPay API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }

    /**
     * Process webhook notification from XixaPay
     *
     * @param array $payload
     * @param string $signature
     * @return array
     */
    public function processWebhook($payload, $signature = null)
    {
        try {
            // Verify signature if provided
            if ($signature) {
                $calculatedSignature = hash_hmac('sha256', json_encode($payload), $this->secretKey);
                if ($calculatedSignature !== $signature) {
                    Log::error('XixaPay Webhook Error: Invalid signature');
                    return [
                        'success' => false,
                        'message' => 'Invalid signature',
                    ];
                }
            }

            $notificationStatus = $payload['notification_status'] ?? '';
            
            if ($notificationStatus === 'payment_successful') {
                return $this->processSuccessfulPayment($payload);
            }

            return [
                'success' => true,
                'message' => 'Event type not handled: ' . $notificationStatus,
            ];
        } catch (Exception $e) {
            Log::error('XixaPay Webhook Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while processing webhook',
            ];
        }
    }

    /**
     * Process successful payment webhook with atomic safety
     *
     * @param array $data
     * @return array
     */
    protected function processSuccessfulPayment($data)
    {
        $transactionId = $data['transaction_id'] ?? '';
        $amount = $data['amount_paid'] ?? 0;
        $settlementAmount = $data['settlement_amount'] ?? 0;
        $settlementFee = $data['settlement_fee'] ?? 0;
        $status = $data['transaction_status'] ?? '';
        $customerId = $data['customer']['customer_id'] ?? '';
        $timestamp = $data['timestamp'] ?? '';

        if (empty($transactionId) || $status !== 'success') {
            return [
                'success' => false,
                'message' => 'Invalid transaction data',
            ];
        }

        $lock = \Illuminate\Support\Facades\Cache::lock('xixapay_webhook:' . $transactionId, 30);
        
        if (!$lock->get()) {
            return [
                'success' => false,
                'message' => 'Transaction is currently being processed',
            ];
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($data, $transactionId, $amount, $settlementAmount, $settlementFee, $customerId, $timestamp) {
                // Find the user by customer_id or by account details
                $user = null;
                
                // Try to find user by XixaPay customer_id stored in virtual_account_details
                $user = User::whereRaw("JSON_CONTAINS(virtual_account_details, '{\"customer_id\": \"$customerId\"}', '$.xixatpay')")
                    ->lockForUpdate()
                    ->first();
                
                if (!$user) {
                    // Try to find by account number
                    $receiverAccountNumber = $data['receiver']['account_number'] ?? '';
                    if ($receiverAccountNumber) {
                        $user = User::whereRaw("JSON_CONTAINS(virtual_account_details, '{\"account_number\": \"$receiverAccountNumber\"}', '$.xixatpay')")
                            ->lockForUpdate()
                            ->first();
                    }
                }

                if (!$user) {
                    return [
                        'success' => false,
                        'message' => 'User not found for this transaction',
                    ];
                }

                // Check if this transaction has already been processed
                $existingTransaction = Transaction::where('meta_data->payment_reference', $transactionId)
                    ->lockForUpdate()
                    ->first();
                    
                if ($existingTransaction) {
                    return [
                        'success' => true,
                        'message' => 'Transaction already processed',
                    ];
                }

                // Create a reference for our system
                $reference = 'XIXAPAY_' . $transactionId;

                // Calculate charge percentage based on settings
                $chargePercentage = (float) Setting::get('virtual_bank_deposit_charge', 0);
                
                // Create wallet funding record
                $walletFunding = WalletFunding::create([
                    'user_id' => $user->id,
                    'reference' => $reference,
                    'amount' => $amount,
                    'payment_method' => 'Xixat Pay Dedicated Bank Account',
                    'status' => 'successful',
                    'fee' => $settlementFee,
                    'meta_data' => [
                        'payment_reference' => $transactionId,
                        'payment_method' => 'virtual_account',
                        'payment_provider' => 'xixatpay',
                        'charge_percentage' => $chargePercentage,
                        'original_amount' => $amount,
                        'settlement_amount' => $settlementAmount,
                        'settlement_fee' => $settlementFee,
                        'sender' => $data['sender'] ?? [],
                        'receiver' => $data['receiver'] ?? [],
                        'timestamp' => $timestamp,
                        'completed_at' => now(),
                    ],
                ]);

                // Create transaction record
                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'reference' => $reference,
                    'type' => 'wallet_funding',
                    'amount' => $amount,
                    'fee' => $settlementFee,
                    'status' => 'successful',
                    'recipient' => $user->email,
                    'description' => 'Wallet Funding of ₦' . $amount . ' via Xixat Pay Dedicated Bank Account',
                    'meta_data' => [
                        'payment_method' => 'Xixat Pay Dedicated Bank Account',
                        'wallet_funding_id' => $walletFunding->id,
                        'payment_reference' => $transactionId,
                        'charge_percentage' => $chargePercentage,
                    ],
                ]);

                // Calculate and record system profit (5% of deposit amount for consistency)
                $profitPercentage = 5.00;
                $profitAmount = ($amount * $profitPercentage) / 100;
                
                $transaction->profit = $profitAmount;
                $transaction->save();

                // Create system profit record
                \App\Models\SystemProfit::create([
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'wallet_funding_id' => $walletFunding->id,
                    'profit_source' => 'xixatpay_wallet_deposit',
                    'amount' => $amount,
                    'profit_percentage' => $profitPercentage,
                    'profit_amount' => $profitAmount,
                    'status' => 'recorded',
                    'description' => "5% profit from Xixat Pay wallet deposit of ₦{$amount}",
                    'meta_data' => [
                        'payment_reference' => $transactionId,
                        'settlement_fee' => $settlementFee,
                        'settlement_amount' => $settlementAmount,
                    ],
                ]);

                // Update user's wallet balance
                $netAmount = $settlementAmount;
                
                // Settle outstanding debts first
                $borrowingService = app(\App\Services\BorrowingService::class);
                $remainingAmount = $borrowingService->settleDebts($user, $netAmount);
                
                if ($remainingAmount < $netAmount) {
                    $settledAmount = $netAmount - $remainingAmount;
                    $notificationService = app(\App\Services\NotificationService::class);
                    $notificationService->sendSystemNotification(
                        $user,
                        'Debt Automatically Settled',
                        "₦{$settledAmount} has been deducted from your virtual account deposit to settle your outstanding debt.",
                        'info'
                    );
                }
                
                $user->wallet_balance += $remainingAmount;
                $user->save();

                // Send notification about the fee if needed
                if ($settlementFee > 0) {
                    $notificationService = app(\App\Services\NotificationService::class);
                    $notificationService->sendSystemNotification(
                        $user,
                        'Wallet Funding Fee Applied',
                        "A service fee of ₦{$settlementFee} has been deducted from your wallet funding of ₦{$amount}. Net amount credited: ₦{$settlementAmount}.",
                        'info'
                    );
                }

                // Process referral bonus
                $referralService = app(\App\Services\ReferralService::class);
                $referralService->processReferralBonus($transaction);

                return [
                    'success' => true,
                    'message' => 'Transaction processed successfully',
                ];
            });
        } catch (\Exception $e) {
            Log::error('XixaPay processSuccessfulPayment failed: ' . $e->getMessage(), [
                'transaction_id' => $transactionId,
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Internal error: ' . $e->getMessage(),
            ];
        } finally {
            $lock->release();
        }    }
}