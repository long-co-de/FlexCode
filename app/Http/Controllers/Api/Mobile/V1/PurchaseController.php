<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\AirtimeController as LegacyAirtimeController;
use App\Http\Controllers\Api\CableController as LegacyCableController;
use App\Http\Controllers\Api\DataController as LegacyDataController;
use App\Http\Controllers\Api\ElectricityController as LegacyElectricityController;
use App\Http\Resources\Mobile\V1\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function verifyCable(Request $request, LegacyCableController $controller)
    {
        return $this->forward($controller->verifySmartCard($request));
    }

    public function verifyElectricity(Request $request, LegacyElectricityController $controller)
    {
        return $this->forward($controller->verifyMeter($request));
    }

    public function airtime(Request $request, LegacyAirtimeController $controller)
    {
        return $this->forwardTransactionResponse($controller->purchase($request));
    }

    public function data(Request $request, LegacyDataController $controller)
    {
        return $this->forwardTransactionResponse($controller->purchase($request));
    }

    public function cable(Request $request, LegacyCableController $controller)
    {
        return $this->forwardTransactionResponse($controller->purchase($request));
    }

    public function electricity(Request $request, LegacyElectricityController $controller)
    {
        $response = $controller->purchase($request);
        $payload = $response->getData(true);

        if ($response->getStatusCode() >= 400) {
            return $this->error($payload['message'] ?? 'Electricity purchase failed.', 'PURCHASE_FAILED', $response->getStatusCode());
        }

        $transaction = Transaction::find($payload['transaction_id'] ?? null);

        return $this->success([
            'status' => $payload['status'] ?? 'pending',
            'reference' => $payload['reference'] ?? null,
            'transaction' => $transaction ? new TransactionResource($transaction) : null,
        ], $payload['message'] ?? 'Electricity purchase is being processed.', $response->getStatusCode());
    }

    protected function forward(JsonResponse $response)
    {
        $payload = $response->getData(true);

        if ($response->getStatusCode() >= 400) {
            return $this->error($payload['message'] ?? 'Request failed.', 'REQUEST_FAILED', $response->getStatusCode());
        }

        return $this->success($payload['data'] ?? $payload, $payload['message'] ?? 'Request completed successfully.');
    }

    protected function forwardTransactionResponse(JsonResponse $response)
    {
        $payload = $response->getData(true);
        $rawMessage = $payload['message'] ?? 'Purchase failed.';

        if ($response->getStatusCode() >= 400) {
            $message = $this->normalizePurchaseErrorMessage($rawMessage);
            $code = match (true) {
                str_contains(strtolower($rawMessage), 'duplicate') => 'DUPLICATE_REQUEST',
                str_contains(strtolower($rawMessage), 'wallet') => 'INSUFFICIENT_BALANCE',
                str_contains(strtolower($rawMessage), 'network does not match') => 'INVALID_NETWORK_SELECTION',
                default => 'PURCHASE_FAILED',
            };

            return $this->error($message, $code, $response->getStatusCode());
        }

        $transaction = isset($payload['transaction']['id']) ? Transaction::find($payload['transaction']['id']) : null;

        return $this->success([
            'transaction' => $transaction ? new TransactionResource($transaction) : ($payload['transaction'] ?? null),
        ], $payload['message'] ?? 'Purchase completed successfully.');
    }

    protected function normalizePurchaseErrorMessage(string $message): string
    {
        $normalized = strtolower(trim($message));

        if (str_contains($normalized, 'please check entered number is not')
            || (str_contains($normalized, 'network') && str_contains($normalized, 'number'))
        ) {
            return 'The selected network does not match this phone number. Please confirm the number and try again.';
        }

        if ((str_contains($normalized, 'api balance')
                || str_contains($normalized, 'provider balance')
                || str_contains($normalized, 'insufficient balance in api')
                || str_contains($normalized, 'insufficient provider balance')
                || str_contains($normalized, 'vendor balance'))
            && ! str_contains($normalized, 'wallet')
        ) {
            return 'This service is temporarily unavailable. Please try again in a few minutes.';
        }

        return $message;
    }
}
