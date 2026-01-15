<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\PaystackService;
use Illuminate\Http\Request;

class PaymentRetrievalController extends Controller
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
        ]);

        $user = $request->user();
        $reference = $validated['reference'];

        try {
            // Check if transaction already exists in our database
            $existingTransaction = Transaction::where('reference', $reference)
                ->where('user_id', $user->id)
                ->first();

            if ($existingTransaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'This payment reference has already been processed.',
                    'data' => $existingTransaction,
                ], 400);
            }

            // Verify payment with Paystack
            $response = $this->paystackService->verifyTransaction($reference);

            if (!$response['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed. Reference not found or invalid.',
                ], 400);
            }

            $paymentData = $response['data'];

            // Check if payment status is successful
            if ($paymentData['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment status is ' . $paymentData['status'] . '. Only successful payments can be retrieved.',
                ], 400);
            }

            // Verify customer email matches
            if ($paymentData['customer']['email'] !== $user->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment email does not match your account email.',
                ], 400);
            }

            // Create transaction record
            $amount = $paymentData['amount'] / 100; // Convert from kobo to naira

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'reference' => $reference,
                'type' => 'wallet_funding',
                'amount' => $amount,
                'status' => 'successful',
                'description' => 'Manual payment retrieval from reference: ' . $reference,
                'meta_data' => json_encode([
                    'paystack_reference' => $reference,
                    'paystack_authorization_code' => $paymentData['authorization']['authorization_code'] ?? null,
                    'payment_method' => 'paystack',
                    'customer_email' => $paymentData['customer']['email'],
                    'order_id' => $paymentData['order_id'] ?? null,
                    'paid_at' => $paymentData['paid_at'],
                ]),
            ]);

            // Credit user's wallet
            $user->increment('wallet_balance', $amount);

            // Settle any outstanding debts
            $borrowingService = app(\App\Services\BorrowingService::class);
            $borrowingService->settleDebts($user, $amount);

            // Send notification
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->sendSystemNotification(
                $user,
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
                    'new_balance' => $user->wallet_balance,
                    'paid_at' => $paymentData['paid_at'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving payment: ' . $e->getMessage(),
            ], 500);
        }
    }
}
