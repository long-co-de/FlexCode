<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\WalletController as LegacyWalletController;
use App\Http\Resources\Mobile\V1\TransactionResource;
use App\Models\PaymentMethod;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WalletFunding;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function balance(Request $request)
    {
        return $this->success([
            'balance' => (float) $request->user()->wallet_balance,
        ], 'Wallet balance fetched successfully.');
    }

    public function summary(Request $request)
    {
        $user = $request->user();
        $transferTotal = (float) $user->transactions()
            ->where('type', 'wallet_transfer')
            ->get()
            ->filter(fn ($transaction) => ! isset(($transaction->meta_data ?? [])['sender_id']))
            ->sum('amount');

        return $this->success([
            'balance' => (float) $user->wallet_balance,
            'virtual_accounts' => array_values($user->virtual_account_details ?? []),
            'stats' => [
                'total_funded' => (float) $user->transactions()->where('type', 'wallet_funding')->whereIn('status', ['success', 'successful'])->sum('amount'),
                'total_withdrawn' => (float) $user->transactions()->where('type', 'withdrawal')->whereIn('status', ['success', 'successful', 'pending'])->sum('amount'),
                'total_transferred' => $transferTotal,
            ],
        ], 'Wallet summary fetched successfully.');
    }

    public function initializeFunding(Request $request, PaystackService $paystackService)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'request_id' => 'required|string|min:20|max:100',
            'redirect_url' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $reference = 'MOBFUND' . strtoupper(Str::random(8)) . time();
        $paymentMethod = PaymentMethod::firstOrCreate(
            ['code' => 'paystack'],
            ['name' => 'Paystack']
        );

        $funding = WalletFunding::create([
            'user_id' => $user->id,
            'payment_method_id' => $paymentMethod->id,
            'reference' => $reference,
            'amount' => $request->amount,
            'fee' => 0,
            'status' => 'pending',
            'response_data' => [
                'channel' => 'mobile_api',
                'request_id' => $request->request_id,
                'redirect_url' => $request->redirect_url,
                'initiated_at' => now()->toIso8601String(),
            ],
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'wallet_funding',
            'amount' => $request->amount,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $user->email,
            'description' => 'Mobile wallet funding of ₦' . number_format($request->amount, 2),
            'meta_data' => [
                'wallet_funding_id' => $funding->id,
                'request_id' => $request->request_id,
                'channel' => 'mobile_api',
            ],
        ]);

        $callbackUrl = route('mobile.api.v1.payments.return', [
            'reference' => $reference,
            'context' => 'wallet_funding',
            'redirect_url' => $request->redirect_url,
        ]);

        $payment = $paystackService->initializeTransaction(
            $request->amount,
            $user->email,
            $reference,
            $callbackUrl,
            [
                'context' => 'wallet_funding',
                'user_id' => $user->id,
                'request_id' => $request->request_id,
            ]
        );

        if (! ($payment['success'] ?? false)) {
            $funding->update([
                'status' => 'failed',
                'response_data' => array_merge($funding->response_data ?? [], [
                    'initialization_error' => $payment['message'] ?? 'Unable to initialize payment.',
                ]),
            ]);

            return $this->error($payment['message'] ?? 'Unable to initialize payment.', 'PAYMENT_INITIALIZATION_FAILED', 400);
        }

        $funding->update([
            'response_data' => array_merge($funding->response_data ?? [], [
                'authorization_url' => $payment['data']['authorization_url'] ?? null,
                'access_code' => $payment['data']['access_code'] ?? null,
            ]),
        ]);

        return $this->success([
            'reference' => $reference,
            'status' => 'pending',
            'checkout' => [
                'authorization_url' => $payment['data']['authorization_url'] ?? null,
                'access_code' => $payment['data']['access_code'] ?? null,
            ],
        ], 'Wallet funding initialized successfully.', 201);
    }

    public function fundingStatus(Request $request, string $reference, PaystackService $paystackService)
    {
        $funding = WalletFunding::where('reference', $reference)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($funding->status === 'pending') {
            $verification = $paystackService->verifyTransaction($reference);

            if (($verification['success'] ?? false) && (($verification['data']['status'] ?? null) === 'success')) {
                $paystackService->processWebhook([
                    'event' => 'charge.success',
                    'data' => $verification['data'],
                ]);
                $funding->refresh();
            }
        }

        $transaction = Transaction::where('reference', $reference)->where('user_id', $request->user()->id)->first();

        return $this->success([
            'reference' => $reference,
            'status' => $funding->status,
            'amount' => (float) $funding->amount,
            'fee' => (float) $funding->fee,
            'response_data' => $funding->response_data ?? [],
            'transaction' => $transaction ? new TransactionResource($transaction) : null,
        ], 'Wallet funding status fetched successfully.');
    }

    public function verifyRecipient(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string',
        ]);

        $recipient = User::where('phone_number', $request->phone_number)
            ->where('id', '!=', $request->user()->id)
            ->first();

        if (! $recipient) {
            return $this->error('User not found.', 'RECIPIENT_NOT_FOUND', 404);
        }

        return $this->success([
            'id' => $recipient->id,
            'name' => $recipient->name,
            'phone_number' => $recipient->phone_number,
            'email' => $recipient->email,
        ], 'Recipient verified successfully.');
    }

    public function transfer(Request $request, LegacyWalletController $controller)
    {
        if (! $request->filled('recipient_email') && $request->filled('phone_number')) {
            $recipient = User::where('phone_number', $request->string('phone_number'))->first();

            if (! $recipient) {
                return $this->error('User not found.', 'RECIPIENT_NOT_FOUND', 404);
            }

            $request->merge([
                'recipient_email' => $recipient->email,
            ]);
        }

        $response = $controller->transfer($request);
        $payload = $response->getData(true);

        if ($response->getStatusCode() >= 400) {
            $code = str_contains(strtolower($payload['message'] ?? ''), 'pin') ? 'INVALID_PIN' : 'TRANSFER_FAILED';
            return $this->error($payload['message'] ?? 'Transfer failed.', $code, $response->getStatusCode());
        }

        $transaction = isset($payload['transaction']['id']) ? Transaction::find($payload['transaction']['id']) : null;

        return $this->success([
            'new_balance' => (float) ($payload['new_balance'] ?? 0),
            'transaction' => $transaction ? new TransactionResource($transaction) : null,
        ], $payload['message'] ?? 'Funds transferred successfully.');
    }

    public function withdraw(Request $request, LegacyWalletController $controller)
    {
        $response = $controller->withdraw($request);
        $payload = $response->getData(true);

        if ($response->getStatusCode() >= 400) {
            $code = str_contains(strtolower($payload['message'] ?? ''), 'pin') ? 'INVALID_PIN' : 'WITHDRAWAL_FAILED';
            return $this->error($payload['message'] ?? 'Withdrawal failed.', $code, $response->getStatusCode());
        }

        $transaction = isset($payload['transaction']['id']) ? Transaction::find($payload['transaction']['id']) : null;

        return $this->success([
            'new_balance' => (float) ($payload['new_balance'] ?? 0),
            'transaction' => $transaction ? new TransactionResource($transaction) : null,
        ], $payload['message'] ?? 'Withdrawal request submitted successfully.');
    }

    public function history(Request $request)
    {
        $transactions = Transaction::where('user_id', $request->user()->id)
            ->whereIn('type', ['wallet_funding', 'wallet_transfer', 'withdrawal', 'commission'])
            ->latest()
            ->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($transactions, TransactionResource::collection($transactions), 'Wallet history fetched successfully.');
    }
}
