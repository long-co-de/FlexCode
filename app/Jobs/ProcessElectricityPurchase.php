<?php

namespace App\Jobs;

use App\Models\SystemProfit;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\PurchaseConfirmation;
use App\Services\DatavendroService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessElectricityPurchase implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    public int $timeout = 120;

    public function __construct(public int $transactionId)
    {
        $this->queue = 'electricity';
    }

    public function handle(DatavendroService $datavendroService): void
    {
        $lock = Cache::lock('electricity_purchase_job:' . $this->transactionId, 180);

        if (!$lock->get()) {
            $this->release(5);
            return;
        }

        try {
            $transaction = Transaction::with('user')->find($this->transactionId);

            if (!$transaction || $transaction->status !== 'pending') {
                return;
            }

            $metaData = $transaction->meta_data ?? [];
            $metaData['processing_stage'] = 'submitted';
            $metaData['provider_submitted_at'] = now()->toISOString();
            $transaction->meta_data = $metaData;
            $transaction->save();

            $providerCode = $metaData['provider_code'] ?? null;
            $meterNumber = $metaData['meter_number'] ?? $transaction->recipient;
            $meterType = $metaData['meter_type'] ?? 'prepaid';
            $phoneNumber = $metaData['phone_number'] ?? optional($transaction->user)->phone_number;
            $customerName = $metaData['customer_name'] ?? null;
            $customerAddress = $metaData['address'] ?? ($metaData['customer_address'] ?? null);

            $response = $datavendroService->payElectricityBill(
                $meterNumber,
                $providerCode,
                $transaction->amount,
                $meterType,
                $transaction->reference,
                $phoneNumber,
                $customerName,
                $customerAddress
            );

            if (!$response['success']) {
                throw new \RuntimeException($response['message'] ?? 'Provider failed to process electricity purchase');
            }

            $apiData = $response['data'] ?? [];
            $token = $response['token'] ?? null;
            $cleanToken = $token;
            if (!empty($token) && str_starts_with($token, 'Token : ')) {
                $cleanToken = substr($token, 8);
            }

            $apiTransactionId = $response['api_transaction_id']
                ?? ($apiData['id'] ?? ($apiData['data']['id'] ?? null));
            $apiIdent = $response['api_ident']
                ?? ($apiData['ident'] ?? ($apiData['data']['ident'] ?? null));

            DB::transaction(function () use ($transaction, $response, $apiData, $apiTransactionId, $apiIdent, $cleanToken, $token) {
                $lockedTransaction = Transaction::where('id', $transaction->id)->lockForUpdate()->first();
                if (!$lockedTransaction || $lockedTransaction->status !== 'pending') {
                    return;
                }

                $metaData = $lockedTransaction->meta_data ?? [];
                $metaData['api_transaction_id'] = $apiTransactionId ? (string) $apiTransactionId : null;
                $metaData['api_ident'] = $apiIdent ? (string) $apiIdent : null;
                $metaData['api_status'] = $response['api_status'] ?? null;
                $metaData['api_response_received_at'] = now()->toISOString();
                $metaData['api_response'] = $apiData;
                $metaData['units'] = $response['units'] ?? null;
                $metaData['processing_stage'] = !empty($cleanToken) ? 'completed' : 'awaiting_token';

                if (!empty($cleanToken)) {
                    $metaData['token'] = $cleanToken;
                    $metaData['original_token'] = $token;
                    $metaData['completed_at'] = now()->toISOString();
                    $lockedTransaction->status = 'successful';
                } else {
                    $lockedTransaction->status = 'pending';
                }

                $lockedTransaction->meta_data = $metaData;
                $lockedTransaction->save();

                if ($lockedTransaction->status === 'successful') {
                    $this->recordProfitIfMissing($lockedTransaction);
                    $lockedTransaction->user?->notify(new PurchaseConfirmation($lockedTransaction, 'electricity'));
                }
            });
        } catch (Throwable $exception) {
            Log::warning('Electricity purchase job attempt failed', [
                'transaction_id' => $this->transactionId,
                'attempt' => $this->attempts(),
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        } finally {
            $lock->release();
        }
    }

    public function failed(Throwable $exception): void
    {
        DB::transaction(function () use ($exception) {
            $transaction = Transaction::where('id', $this->transactionId)->lockForUpdate()->first();
            if (!$transaction || $transaction->status !== 'pending') {
                return;
            }

            $user = User::where('id', $transaction->user_id)->lockForUpdate()->first();
            if (!$user) {
                return;
            }

            $refundAmount = (float) $transaction->amount + (float) ($transaction->fee ?? 0);
            $user->wallet_balance += $refundAmount;
            $user->save();

            $metaData = $transaction->meta_data ?? [];
            $metaData['processing_stage'] = 'failed';
            $metaData['provider_error'] = 'Electricity purchase could not be completed after multiple attempts.';
            $metaData['job_failed_at'] = now()->toISOString();
            $metaData['job_failure_reason'] = $exception->getMessage();
            $metaData['refunded_at'] = now()->toISOString();
            $metaData['refund_amount'] = $refundAmount;

            $transaction->status = 'failed';
            $transaction->meta_data = $metaData;
            $transaction->save();

            Log::error('Electricity purchase permanently failed and refunded', [
                'transaction_id' => $transaction->id,
                'user_id' => $user->id,
                'refund_amount' => $refundAmount,
                'error' => $exception->getMessage(),
            ]);
        });
    }

    private function recordProfitIfMissing(Transaction $transaction): void
    {
        if (($transaction->profit ?? 0) <= 0) {
            return;
        }

        SystemProfit::firstOrCreate(
            [
                'transaction_id' => $transaction->id,
                'profit_source' => 'electricity',
            ],
            [
                'user_id' => $transaction->user_id,
                'amount' => $transaction->amount,
                'profit_percentage' => $transaction->amount > 0 ? (($transaction->profit / $transaction->amount) * 100) : 0,
                'profit_amount' => $transaction->profit,
                'status' => 'recorded',
                'description' => 'Profit from electricity transaction: ' . $transaction->reference,
                'meta_data' => [
                    'reference' => $transaction->reference,
                    'type' => $transaction->type,
                    'recipient' => $transaction->recipient,
                ],
            ]
        );
    }
}
