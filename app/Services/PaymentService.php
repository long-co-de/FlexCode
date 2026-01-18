<?php
// File: PaymentService.php
namespace App\Services;

use App\Models\User;
use App\Models\UserCard;
use App\Models\Borrowing;
use App\Models\BorrowingRepayment;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    protected $paystackService;

    public function __construct(PaystackService $paystackService)
    {
        $this->paystackService = $paystackService;
    }

    /**
     * Charge a user's default card
     */
    public function chargeCard($cardToken, $amount, $description)
    {
        $user = User::whereHas('cards', function($query) use ($cardToken) {
            $query->where('card_token', $cardToken);
        })->first();

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Card not found',
            ];
        }

        $card = $user->cards()->where('card_token', $cardToken)->first();
        if (!$card) {
            return [
                'success' => false,
                'message' => 'Card not found',
            ];
        }

        // Charge via Paystack
        return $this->paystackService->chargeAuthorization(
            $card->authorization_code,
            $amount,
            $user->email,
            $description
        );
    }


    /**
     * Process borrowing repayment
     */
    public function processBorrowingRepayment(Borrowing $borrowing)
    {
        $user = $borrowing->user;
        $defaultCard = $user->cards()->where('is_default', true)->first();

        if (!$defaultCard) {
            throw new \Exception('No default card found for auto-deduction');
        }

        // Generate unique reference
        $reference = 'BOR_REPAY_' . time() . '_' . uniqid();

        // Charge the card
        $chargeResponse = $this->paystackService->chargeAuthorization(
            $defaultCard->authorization_code,
            $borrowing->total_amount,
            $user->email,
            "Repayment for borrowing {$borrowing->reference}"
        );

        if ($chargeResponse['success']) {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($borrowing, $user, $defaultCard, $chargeResponse, $reference) {
                // Re-fetch with lock
                $borrowing = Borrowing::where('id', $borrowing->id)->lockForUpdate()->first();
                if ($borrowing->status === 'paid') {
                    return [
                        'success' => true,
                        'message' => 'Already paid',
                    ];
                }

                // Create repayment record
                $repayment = BorrowingRepayment::create([
                    'borrowing_id' => $borrowing->id,
                    'user_id' => $user->id,
                    'reference' => $reference,
                    'amount' => $borrowing->total_amount,
                    'payment_method' => 'card',
                    'status' => 'success',
                    'payment_gateway_response' => json_encode($chargeResponse['data']),
                    'metadata' => [
                        'card_last_four' => $defaultCard->last_four,
                        'card_type' => $defaultCard->card_type,
                        'transaction_id' => $chargeResponse['data']['id'] ?? null,
                    ],
                ]);

                // Update borrowing status
                $borrowing->status = 'paid';
                $borrowing->repaid_at = now();
                $borrowing->save();

                // Return available credit to eligibility
                $eligibility = $user->borrowingEligibility;
                if ($eligibility) {
                    $eligibility->available_credit += $borrowing->amount;
                    $eligibility->save();
                }

                // Create transaction record for the repayment (PROFIT TRACKING)
                $interestProfit = $borrowing->total_amount - $borrowing->amount;
                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'reference' => $reference,
                    'type' => 'borrowing_repayment',
                    'amount' => $borrowing->total_amount,
                    'profit' => $interestProfit,
                    'status' => 'successful',
                    'recipient' => 'System',
                    'description' => "Debt settlement (Card) for {$borrowing->reference}",
                    'meta_data' => [
                        'borrowing_id' => $borrowing->id,
                        'method' => 'card',
                        'principal' => $borrowing->amount,
                        'interest' => $interestProfit,
                        'paystack_id' => $chargeResponse['data']['id'] ?? null,
                    ],
                ]);

                Log::info('Borrowing repayment successful with profit tracked', [
                    'borrowing_id' => $borrowing->id,
                    'user_id' => $user->id,
                    'amount' => $borrowing->total_amount,
                    'profit' => $interestProfit
                ]);

                return [
                    'success' => true,
                    'message' => 'Repayment successful',
                    'repayment' => $repayment,
                ];
            });
        }

        // Handle failure
        Log::error('Borrowing repayment failed', [
            'borrowing_id' => $borrowing->id,
            'user_id' => $user->id,
            'error' => $chargeResponse['message'],
        ]);

        throw new \Exception('Payment failed: ' . $chargeResponse['message']);
    }

    /**
     * Verify card for tokenization
     */
    public function verifyCardForTokenization($authorizationCode, $user)
    {
        $verification = $this->paystackService->verifyCard($authorizationCode, $user->email);
        
        if (!$verification['success']) {
            throw new \Exception('Card verification failed: ' . $verification['message']);
        }

        return $verification['data'];
    }

    /**
     * Test card by charging a small amount
     */
    public function testCard($authorizationCode, $user)
    {
        // Charge a small test amount (e.g., 100 Naira)
        $testAmount = 100;
        
        $chargeResponse = $this->paystackService->chargeAuthorization(
            $authorizationCode,
            $testAmount,
            $user->email,
            "Card verification test"
        );

        if ($chargeResponse['success']) {
            // Refund the test charge
            $this->refundTransaction(
                $chargeResponse['data']['reference'] ?? '',
                $testAmount,
                "Refund for card verification test"
            );

            return [
                'success' => true,
                'message' => 'Card verified successfully',
            ];
        }

        return [
            'success' => false,
            'message' => 'Card test failed: ' . $chargeResponse['message'],
        ];
    }

    /**
     * Refund a transaction
     */
    public function refundTransaction($transactionReference, $amount, $reason)
    {
        // This would call Paystack's refund endpoint
        // Note: You need to implement the refund logic based on your requirements
        
        Log::info('Refund requested', [
            'transaction_reference' => $transactionReference,
            'amount' => $amount,
            'reason' => $reason,
        ]);

        return [
            'success' => true,
            'message' => 'Refund initiated',
        ];
    }

    /**
     * Get user's payment history
     */
    public function getUserPaymentHistory(User $user)
    {
        $payments = [];

        // Get wallet fundings
        $walletFundings = $user->walletFundings()
            ->where('status', 'successful')
            ->with('paymentMethod')
            ->latest()
            ->limit(50)
            ->get();

        foreach ($walletFundings as $funding) {
            $payments[] = [
                'type' => 'wallet_funding',
                'amount' => $funding->amount,
                'status' => $funding->status,
                'payment_method' => $funding->paymentMethod->name ?? 'Paystack',
                'created_at' => $funding->created_at,
                'reference' => $funding->reference,
            ];
        }

        // Get borrowing repayments
        $repayments = BorrowingRepayment::where('user_id', $user->id)
            ->where('status', 'success')
            ->with('borrowing')
            ->latest()
            ->limit(50)
            ->get();

        foreach ($repayments as $repayment) {
            $payments[] = [
                'type' => 'borrowing_repayment',
                'amount' => $repayment->amount,
                'status' => $repayment->status,
                'payment_method' => $repayment->payment_method,
                'created_at' => $repayment->created_at,
                'reference' => $repayment->reference,
                'borrowing_reference' => $repayment->borrowing->reference ?? '',
            ];
        }

        // Sort by date
        usort($payments, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return $payments;
    }

    /**
     * Check if user can make payment (fraud/risk check)
     */
    public function canMakePayment(User $user, $amount)
    {
        // Basic checks
        if ($amount <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid amount',
            ];
        }

        // Check if user has active cards
        if (!$user->cards()->where('is_active', true)->exists()) {
            return [
                'success' => false,
                'message' => 'No active payment method',
            ];
        }

        // Add more fraud/risk checks as needed
        // - Daily transaction limit
        // - Suspicious activity
        // - Account age restrictions
        // - etc.

        return [
            'success' => true,
            'message' => 'Payment can proceed',
        ];
    }
     /**
     * Charge authorization code
     */
    public function chargeAuthorization($authorizationCode, $amount, $email, $description)
    {
        // Delegate to PaystackService
        return $this->paystackService->chargeAuthorization(
            $authorizationCode,
            $amount,
            $email,
            $description
        );
    }
}