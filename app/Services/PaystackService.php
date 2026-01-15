<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use App\Models\User;
use App\Models\Transaction;
use App\Models\WalletFunding;
use App\Models\UserCard;
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
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/customer', [
                'email' => $user->email,
                'first_name' => explode(' ', $user->name)[0] ?? $user->name,
                'last_name' => explode(' ', $user->name)[1] ?? '',
                'phone' => $user->phone_number,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to create customer',
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

        if (empty($reference) || $status !== 'success') {
            return [
                'success' => false,
                'message' => 'Invalid transaction data',
            ];
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
     * Process wallet funding transaction
     */
    protected function processWalletFunding($reference, $amount, $data)
    {
        $walletFunding = WalletFunding::where('reference', $reference)->first();
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

        $walletFunding->status = 'successful';
        $walletFunding->meta_data = array_merge($walletFunding->meta_data ?? [], [
            'completed_at' => now(),
            'payment_reference' => $data['id'] ?? '',
            'payment_method' => 'paystack',
            'payment_details' => $data,
        ]);
        $walletFunding->save();

        $transaction = Transaction::where('reference', $reference)->first();
        if ($transaction) {
            $transaction->status = 'successful';
            $transaction->save();
        }

        $user = User::find($walletFunding->user_id);
        if ($user) {
            $user->wallet_balance += $amount;
            $user->save();
        }

        return [
            'success' => true,
            'message' => 'Wallet funding processed successfully',
        ];
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