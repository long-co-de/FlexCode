<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use App\Models\User;
use App\Models\Transaction;
use App\Models\WalletFunding;
use Exception;

class MonnifyService
{
    protected $apiKey;
    protected $secretKey;
    protected $baseUrl;
    protected $contractCode;
    protected $accessToken;

    public function __construct()
    {
        $this->apiKey = Setting::where('key', 'monnify_api_key')->value('value');
        $this->secretKey = Setting::where('key', 'monnify_secret_key')->value('value');
        $this->baseUrl = Setting::where('key', 'monnify_base_url')->value('value') ?? 'https://api.monnify.com/api/v1';
        $this->contractCode = Setting::where('key', 'monnify_contract_code')->value('value');
        $this->accessToken = $this->getAccessToken();
    }

    /**
     * Get access token from Monnify API
     *
     * @return string|null
     */
    protected function getAccessToken()
    {
        try {
            $response = Http::withBasicAuth($this->apiKey, $this->secretKey)
                ->post($this->baseUrl . '/auth/login');

            if ($response->successful()) {
                return $response->json()['responseBody']['accessToken'] ?? null;
            }

            Log::error('Monnify API Error: Failed to get access token', [
                'response' => $response->json(),
            ]);

            return null;
        } catch (Exception $e) {
            Log::error('Monnify API Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Initialize payment transaction
     *
     * @param float $amount
     * @param string $reference
     * @param string $customerName
     * @param string $customerEmail
     * @param string $redirectUrl
     * @param string $paymentDescription
     * @return array
     */
    public function initializeTransaction($amount, $reference, $customerName, $customerEmail, $redirectUrl, $paymentDescription)
    {
        try {
            if (!$this->accessToken) {
                return [
                    'success' => false,
                    'message' => 'Failed to authenticate with Monnify API',
                ];
            }

            $response = Http::withToken($this->accessToken)
                ->post($this->baseUrl . '/merchant/transactions/init-transaction', [
                    'amount' => $amount,
                    'customerName' => $customerName,
                    'customerEmail' => $customerEmail,
                    'paymentReference' => $reference,
                    'paymentDescription' => $paymentDescription,
                    'currencyCode' => 'NGN',
                    'contractCode' => $this->contractCode,
                    'redirectUrl' => $redirectUrl,
                    'paymentMethods' => ['CARD', 'ACCOUNT_TRANSFER', 'USSD', 'PHONE_NUMBER'],
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['responseBody'] ?? [],
                ];
            }

            Log::error('Monnify API Error: Failed to initialize transaction', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['responseMessage'] ?? 'Failed to initialize transaction',
            ];
        } catch (Exception $e) {
            Log::error('Monnify API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }

    /**
     * Verify transaction status
     *
     * @param string $reference
     * @return array
     */
    public function verifyTransaction($reference)
    {
        try {
            if (!$this->accessToken) {
                return [
                    'success' => false,
                    'message' => 'Failed to authenticate with Monnify API',
                ];
            }

            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . '/merchant/transactions/query', [
                    'paymentReference' => $reference,
                ]);

            if ($response->successful()) {
                $responseBody = $response->json()['responseBody'] ?? [];
                $paymentStatus = $responseBody['paymentStatus'] ?? '';

                return [
                    'success' => true,
                    'data' => $responseBody,
                    'status' => $this->mapPaymentStatus($paymentStatus),
                ];
            }

            Log::error('Monnify API Error: Failed to verify transaction', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['responseMessage'] ?? 'Failed to verify transaction',
            ];
        } catch (Exception $e) {
            Log::error('Monnify API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }

    /**
     * Map Monnify payment status to application status
     *
     * @param string $monnifyStatus
     * @return string
     */
    protected function mapPaymentStatus($monnifyStatus)
    {
        switch ($monnifyStatus) {
            case 'PAID':
                return 'successful';
            case 'PENDING':
                return 'pending';
            case 'FAILED':
            case 'EXPIRED':
                return 'failed';
            default:
                return 'pending';
        }
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
            if (!$this->accessToken) {
                return [
                    'success' => false,
                    'message' => 'Failed to authenticate with Monnify API',
                ];
            }

            $response = Http::withToken($this->accessToken)
                ->post($this->baseUrl . '/bank-transfer/reserved-accounts', [
                    'accountReference' => 'USER' . $user->id . '-' . time(),
                    'accountName' => $user->name,
                    'currencyCode' => 'NGN',
                    'contractCode' => $this->contractCode,
                    'customerEmail' => $user->email,
                    'customerName' => $user->name,
                    'getAllAvailableBanks' => true,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['responseBody'] ?? [],
                ];
            }

            Log::error('Monnify API Error: Failed to create virtual account', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['responseMessage'] ?? 'Failed to create virtual account',
            ];
        } catch (Exception $e) {
            Log::error('Monnify API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }

    /**
     * Get virtual account details
     *
     * @param string $accountReference
     * @return array
     */
    public function getVirtualAccount($accountReference)
    {
        try {
            if (!$this->accessToken) {
                return [
                    'success' => false,
                    'message' => 'Failed to authenticate with Monnify API',
                ];
            }

            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . '/bank-transfer/reserved-accounts/' . $accountReference);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['responseBody'] ?? [],
                ];
            }

            Log::error('Monnify API Error: Failed to get virtual account details', [
                'response' => $response->json(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['responseMessage'] ?? 'Failed to get virtual account details',
            ];
        } catch (Exception $e) {
            Log::error('Monnify API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the payment gateway',
            ];
        }
    }

    /**
     * Process webhook notification from Monnify
     *
     * @param array $payload
     * @return array
     */
    public function processWebhook($payload)
    {
        try {
            $eventType = $payload['eventType'] ?? '';
            $eventData = $payload['eventData'] ?? [];

            if ($eventType === 'SUCCESSFUL_TRANSACTION') {
                return $this->processSuccessfulTransaction($eventData);
            }

            return [
                'success' => true,
                'message' => 'Event type not handled: ' . $eventType,
            ];
        } catch (Exception $e) {
            Log::error('Monnify Webhook Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while processing webhook',
            ];
        }
    }

    /**
     * Process successful transaction webhook with atomic safety
     *
     * @param array $eventData
     * @return array
     */
    protected function processSuccessfulTransaction($eventData)
    {
        $reference = $eventData['paymentReference'] ?? '';
        $amount = $eventData['amountPaid'] ?? 0;
        $status = $eventData['paymentStatus'] ?? '';
        $paymentMethod = $eventData['paymentMethod'] ?? '';

        if (empty($reference) || $status !== 'PAID') {
            return [
                'success' => false,
                'message' => 'Invalid transaction data',
            ];
        }

        $lock = \Illuminate\Support\Facades\Cache::lock('monnify_webhook:' . $reference, 30);
        
        if (!$lock->get()) {
            return [
                'success' => false,
                'message' => 'Transaction is currently being processed',
            ];
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($reference, $amount, $paymentMethod, $eventData) {
                // Find and lock the wallet funding record
                $walletFunding = WalletFunding::where('reference', $reference)
                    ->lockForUpdate()
                    ->first();

                if (!$walletFunding) {
                    return [
                        'success' => false,
                        'message' => 'Wallet funding record not found',
                    ];
                }

                // If already processed, return success
                if ($walletFunding->status === 'successful') {
                    return [
                        'success' => true,
                        'message' => 'Transaction already processed',
                    ];
                }

                // Apply appropriate charge based on payment method
                $chargePercentage = $this->getChargePercentageForPaymentMethod($paymentMethod);
                $chargeAmount = ($amount * $chargePercentage) / 100;
                $finalAmount = $amount - $chargeAmount;

                // Update wallet funding status and include charge information
                $walletFunding->status = 'successful';
                $walletFunding->meta_data = array_merge($walletFunding->meta_data ?? [], [
                    'completed_at' => now(),
                    'payment_reference' => $eventData['transactionReference'] ?? '',
                    'payment_method' => $paymentMethod,
                    'payment_source' => $eventData['paymentSourceInformation'] ?? [],
                    'original_amount' => $amount,
                    'charge_percentage' => $chargePercentage,
                    'charge_amount' => $chargeAmount,
                    'final_amount' => $finalAmount,
                ]);
                $walletFunding->save();

                // Find and lock the transaction record
                $transaction = Transaction::where('reference', $reference)->lockForUpdate()->first();
                if ($transaction) {
                    $transaction->status = 'successful';
                    $transaction->save();
                }

                // Credit user wallet with debt settlement
                $user = User::where('id', $walletFunding->user_id)->lockForUpdate()->first();
                if ($user) {
                    // Settle outstanding debts first
                    $borrowingService = app(\App\Services\BorrowingService::class);
                    $remainingAmount = $borrowingService->settleDebts($user, $finalAmount);
                    
                    if ($remainingAmount < $finalAmount) {
                        $settledAmount = $finalAmount - $remainingAmount;
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

                    // Process referral bonus
                    $referralService = app(\App\Services\ReferralService::class);
                    if ($transaction) {
                        $referralService->processReferralBonus($transaction);
                    }
                }

                return [
                    'success' => true,
                    'message' => 'Transaction processed successfully',
                ];
            });
        } catch (\Exception $e) {
            Log::error('Monnify processSuccessfulTransaction failed: ' . $e->getMessage(), [
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
     * Get the charge percentage based on payment method
     *
     * @param string $paymentMethod
     * @return float
     */
    protected function getChargePercentageForPaymentMethod($paymentMethod)
    {
        // Map Monnify payment methods to our charge settings
        if (in_array(strtoupper($paymentMethod), ['ACCOUNT_TRANSFER', 'BANK_TRANSFER'])) {
            return (float) Setting::get('virtual_bank_deposit_charge', 0);
        } elseif (strtoupper($paymentMethod) === 'CARD') {
            return (float) Setting::get('card_payment_charge', 0);
        } else {
            // For other methods like USSD, phone number, etc.
            return (float) Setting::get('online_payment_charge', 0);
        }
    }
}