<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use App\Models\Transaction;
use App\Models\User;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentRetrievalController extends AtomicController
{
    protected $paystackService;

    public function __construct(PaystackService $paystackService)
    {
        $this->paystackService = $paystackService;
    }

    /**
     * Show payment retrieval page
     */
    public function show()
    {
        return inertia('User/PaymentRetrieval', []);
    }

    /**
     * Retrieve and verify payment from Paystack
     */
    public function retrieve(Request $request)
    {
        $validated = $request->validate([
            'reference' => 'required|string|max:255',
            'request_id' => 'nullable|string',
        ]);

        $user = $request->user();
        $reference = $validated['reference'];

        // **SECURITY FIX 1: Deduplication**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'payment_retrieval')) {
            return response()->json([
                'success' => false,
                'message' => 'This request is already being processed.',
            ], 400);
        }

        try {
            // **SECURITY FIX 2: Use atomic transaction to prevent double-crediting**
            return DB::transaction(function () use ($user, $reference, $requestId) {
                // Lock the user row
                $lockedUser = User::where('id', $user->id)->lockForUpdate()->firstOrFail();

                // Check if transaction already exists in our database with row locking
                $existingTransaction = Transaction::where('reference', $reference)
                    ->lockForUpdate()
                    ->first();

                if ($existingTransaction) {
                    throw new \Exception('This payment reference has already been processed.');
                }

                // Verify payment with Paystack
                $response = $this->paystackService->verifyTransaction($reference);

                if (!$response['success']) {
                    throw new \Exception('Payment verification failed. Reference not found or invalid.');
                }

                $paymentData = $response['data'];

                // Check if payment status is successful
                if ($paymentData['status'] !== 'success') {
                    throw new \Exception('Payment status is ' . $paymentData['status'] . '. Only successful payments can be retrieved.');
                }

                // Verify customer email matches
                if ($paymentData['customer']['email'] !== $lockedUser->email) {
                    throw new \Exception('Payment email does not match your account email.');
                }

                // Create transaction record
                $amount = $paymentData['amount'] / 100; // Convert from kobo to naira

                // Calculate charges based on payment channel/method
                $charges = $this->calculateCharges($amount, $paymentData);
                $amountAfterCharges = $amount - $charges;
                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'wallet_funding',
                    'amount' => $amount,
                    'status' => 'successful',
                    'description' => 'Manual payment retrieval from reference: ' . $reference,
                    'meta_data' => [
                        'paystack_reference' => $reference,
                        'paystack_authorization_code' => $paymentData['authorization']['authorization_code'] ?? null,
                        'payment_method' => 'paystack',
                        'customer_email' => $paymentData['customer']['email'],
                        'order_id' => $paymentData['order_id'] ?? null,
                        'paid_at' => $paymentData['paid_at'],
                        'request_id' => $requestId,
                    ],
                ]);

                // Credit user's wallet using helper
                $this->creditWallet($lockedUser, $amountAfterCharges, 'Manual Payment Retrieval');

                // Settle any outstanding debts
                $borrowingService = app(\App\Services\BorrowingService::class);
                $borrowingService->settleDebts($lockedUser, $amount);

                // Send notification outside of transaction would be better but we'll stick to logic for now
                // Actually, let's keep it here for simplicity of the refactor
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationService->sendSystemNotification(
                    $lockedUser,
                    'Payment Retrieved Successfully',
                    "Your payment of ₦" . number_format($amount, 2) . " has been retrieved and added to your wallet.",
                    'success'
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Payment retrieved successfully! ₦' . number_format($amount, 2) . ' has been added to your wallet.',
                    'data' => [
                        'transaction' => $transaction,
                        'amount' => $amount,
                        'new_balance' => $lockedUser->wallet_balance,
                        'paid_at' => $paymentData['paid_at'],
                    ],
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Calculate charges based on payment method/channel from Paystack
     * 
     * @param float $amount
     * @param array $paymentData
     * @return float
     */
    private function calculateCharges($amount, $paymentData)
    {
        // Get the channel/method from Paystack response
        $channel = $paymentData['authorization']['channel'] ?? null;
        $isBank = $paymentData['authorization']['bank'] ?? null;

        // Dedicated bank account: 1.5% only
        if ($channel === 'bank' || $isBank) {
            return (1.5 / 100) * $amount;
        }

        // Online normal checkout (card, ussd, etc.): 1.5% + 100 if amount >= 2000
        if ($amount >= 2000) {
            return (1.5 / 100) * $amount + 100;
        }

        // Default: 1.5%
        return (1.5 / 100) * $amount;
    }
}
