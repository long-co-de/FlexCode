<?php

namespace App\Services;

use App\Models\Setting;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FlutterwaveService
{
    protected $secretKey;

    protected $baseUrl;

    /**
     * Disco slug to Flutterwave biller code mapping.
     * Codes are from Flutterwave's bills documentation.
     */
    protected array $electricityBillers = [
        'ikeja-electric' => 'BIL113',
        'eko-electric' => 'BIL112',
        'abuja-electric' => 'BIL204',
        'kano-electric' => 'BIL120',
        'enugu-electric' => 'BIL115',
        'portharcourt-electric' => 'BIL116',
        'portharcourt-electricity' => 'BIL116',
        'ibadan-electric' => 'BIL114',
        'kaduna-electric' => 'BIL119',
        'benin-electric' => 'BIL117',
        'yola-electric' => 'BIL118',
        // Common aliases
        'ikeja' => 'BIL113',
        'eko' => 'BIL112',
        'abuja' => 'BIL204',
    ];

    public function __construct()
    {
        $this->secretKey = config('services.flutterwave.secret_key')
            ?? Setting::where('key', 'flutterwave_secret_key')->value('value');

        $base = config('services.flutterwave.base_url')
            ?? Setting::where('key', 'flutterwave_base_url')->value('value')
            ?? 'https://api.flutterwave.com/v3';

        $this->baseUrl = rtrim($base, '/');
    }

    protected function client()
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->withoutVerifying();
    }

    public function getElectricityBillerCode($providerCode): ?string
    {
        if (empty($providerCode)) {
            return null;
        }

        $key = strtolower((string) $providerCode);
        return $this->electricityBillers[$key] ?? null;
    }

    public function getBillItems(string $billerCode): array
    {
        $cacheKey = 'flutterwave:bills:items:' . $billerCode;

        try {
            return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($billerCode) {
                return $this->fetchBillItems($billerCode);
            });
        } catch (\Throwable $e) {
            Log::warning('Flutterwave getBillItems cache fallback: ' . $e->getMessage());
            return $this->fetchBillItems($billerCode);
        }
    }

    protected function fetchBillItems(string $billerCode): array
    {
        try {
            $response = $this->client()->get($this->baseUrl . '/bills/' . $billerCode . '/items', [
                'country' => 'NG',
            ]);

            if ($response->successful()) {
                return $response->json('data') ?? [];
            }

            Log::warning('Flutterwave getBillItems failed', [
                'biller_code' => $billerCode,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        } catch (Exception $e) {
            Log::error('Flutterwave getBillItems error: ' . $e->getMessage());
        }

        return [];
    }

    protected function resolveItemCode(string $billerCode, string $meterType, $amount = null): ?string
    {
        // Allow manual overrides via settings when bill items cannot be fetched.
        $typeKey = strtolower($meterType) === 'postpaid' ? 'postpaid' : 'prepaid';
        $override = Setting::get('flutterwave_item_code_' . strtolower($billerCode) . '_' . $typeKey);
        if (!empty($override)) {
            return (string) $override;
        }

        $items = $this->getBillItems($billerCode);
        if (empty($items)) {
            return null;
        }

        $meterType = $typeKey;

        // First, try to match by name/label containing prepaid/postpaid.
        foreach ($items as $item) {
            $name = strtolower((string) ($item['name'] ?? $item['label'] ?? ''));
            if ($name !== '' && str_contains($name, $meterType)) {
                return (string) ($item['item_code'] ?? '');
            }
        }

        // Next, try to match by amount bounds if available.
        if ($amount !== null) {
            $amountValue = (float) $amount;
            foreach ($items as $item) {
                $min = isset($item['min_amount']) ? (float) $item['min_amount'] : null;
                $max = isset($item['max_amount']) ? (float) $item['max_amount'] : null;

                $withinMin = $min === null || $amountValue >= $min;
                $withinMax = $max === null || $amountValue <= $max;

                if ($withinMin && $withinMax && !empty($item['item_code'])) {
                    return (string) $item['item_code'];
                }
            }
        }

        // Finally, fall back to the first available item code.
        foreach ($items as $item) {
            if (!empty($item['item_code'])) {
                return (string) $item['item_code'];
            }
        }

        return null;
    }

    public function validateBill(string $itemCode, string $meterNumber): array
    {
        try {
            $payload = [
                'item_code' => $itemCode,
                'code' => $meterNumber,
                'customer' => $meterNumber,
                'country' => 'NG',
            ];

            Log::info('Flutterwave validateBill Request', $payload);
            $response = $this->client()->post($this->baseUrl . '/bills/validate', $payload);
            Log::info('Flutterwave validateBill Response', [
                'status' => $response->status(),
                'data' => $response->json(),
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'Bill validation failed',
                'status' => $response->status(),
                'body' => $response->body(),
            ];
        } catch (Exception $e) {
            Log::error('Flutterwave validateBill error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while validating the bill',
            ];
        }
    }

    public function validateMeter($meterNumber, $providerCode, $meterType): array
    {
        if (empty($this->secretKey)) {
            return [
                'success' => false,
                'message' => 'Flutterwave secret key is not configured',
            ];
        }

        $billerCode = $this->getElectricityBillerCode($providerCode);
        if (!$billerCode) {
            return [
                'success' => false,
                'message' => 'Unsupported electricity provider for Flutterwave',
            ];
        }

        $typeKey = strtolower((string) $meterType) === 'postpaid' ? 'postpaid' : 'prepaid';
        $providerOverrideKey = 'flutterwave_item_code_' . strtolower((string) $providerCode) . '_' . $typeKey;
        $itemCode = Setting::get($providerOverrideKey);
        if (empty($itemCode)) {
            $itemCode = $this->resolveItemCode($billerCode, (string) $meterType, null);
        }
        if (!$itemCode) {
            return [
                'success' => false,
                'message' => 'Could not resolve Flutterwave item code for this provider',
            ];
        }

        $result = $this->validateBill($itemCode, (string) $meterNumber);
        if (!$result['success']) {
            return $result;
        }

        $data = $result['data']['data'] ?? [];
        // Normalize a couple of common fields for existing controllers.
        $name = $data['name'] ?? $data['customer_name'] ?? null;
        $address = $data['address'] ?? $data['customer_address'] ?? null;

        return [
            'success' => true,
            'data' => array_merge($data, [
                'name' => $name,
                'address' => $address,
                'biller_code' => $billerCode,
                'item_code' => $itemCode,
                'invalid' => empty($name),
            ]),
        ];
    }

    public function payElectricityBill($meterNumber, $providerCode, $amount, $meterType, $reference = null, $phone = null): array
    {
        if (empty($this->secretKey)) {
            return [
                'success' => false,
                'message' => 'Flutterwave secret key is not configured',
            ];
        }

        $billerCode = $this->getElectricityBillerCode($providerCode);
        if (!$billerCode) {
            return [
                'success' => false,
                'message' => 'Unsupported electricity provider for Flutterwave',
            ];
        }

        $typeKey = strtolower((string) $meterType) === 'postpaid' ? 'postpaid' : 'prepaid';
        $providerOverrideKey = 'flutterwave_item_code_' . strtolower((string) $providerCode) . '_' . $typeKey;
        $itemCode = Setting::get($providerOverrideKey);
        if (empty($itemCode)) {
            $itemCode = $this->resolveItemCode($billerCode, (string) $meterType, $amount);
        }
        if (!$itemCode) {
            return [
                'success' => false,
                'message' => 'Could not resolve Flutterwave item code for this provider',
            ];
        }

        // Validate first to catch obvious provider-side issues early.
        $validation = $this->validateBill($itemCode, (string) $meterNumber);
        if (!$validation['success']) {
            return $validation;
        }

        try {
            if (empty($reference)) {
                $reference = 'ELEC' . strtoupper(Str::random(8)) . time();
            }

            $payload = [
                'country' => 'NG',
                'customer_id' => (string) $meterNumber,
                'amount' => (float) $amount,
                'reference' => $reference,
                'biller_code' => $billerCode,
                'item_code' => $itemCode,
            ];

            if (!empty($phone)) {
                $payload['phone_number'] = (string) $phone;
            }

            $callbackUrl = Setting::get('flutterwave_callback_url');
            if (!empty($callbackUrl)) {
                $payload['callback_url'] = $callbackUrl;
            }

            Log::info('Flutterwave payElectricityBill Request', $payload);
            $response = $this->client()->post($this->baseUrl . '/bills', $payload);
            Log::info('Flutterwave payElectricityBill Response', [
                'status' => $response->status(),
                'data' => $response->json(),
            ]);

            if (!$response->successful()) {
                Log::warning('Flutterwave payElectricityBill Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'biller_code' => $billerCode,
                    'item_code' => $itemCode,
                ]);

                return [
                    'success' => false,
                    'message' => $response->json('message') ?? 'Failed to process bill payment',
                    'status' => $response->status(),
                    'body' => $response->body(),
                ];
            }

            $responseData = $response->json();
            $status = strtolower((string) ($responseData['status'] ?? ''));
            $isSuccess = $status === 'success' || $status === 'successful';

            $token = null;
            $units = null;

            // Flutterwave returns the token/units in the status endpoint for prepaid meters.
            $statusCheck = $this->checkBillStatus($reference);
            if ($statusCheck['success']) {
                $extra = $statusCheck['data']['data']['extra'] ?? [];
                $token = $extra['token'] ?? $extra['Token'] ?? null;
                $units = $extra['units'] ?? $extra['Units'] ?? null;
            }

            return [
                'success' => $isSuccess,
                'data' => $responseData,
                'provider' => 'flutterwave',
                'reference' => $reference,
                'biller_code' => $billerCode,
                'item_code' => $itemCode,
                'token' => $token,
                'units' => $units,
                'message' => $responseData['message'] ?? ($isSuccess ? 'Electricity bill payment successful' : 'Electricity bill payment failed'),
            ];
        } catch (Exception $e) {
            Log::error('Flutterwave payElectricityBill error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to Flutterwave',
            ];
        }
    }

    public function checkBillStatus(string $reference): array
    {
        try {
            $response = $this->client()->get($this->baseUrl . '/bills/' . $reference, [
                'country' => 'NG',
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'status' => $response->status(),
                'body' => $response->body(),
                'message' => $response->json('message') ?? 'Unable to confirm bill status',
            ];
        } catch (Exception $e) {
            Log::warning('Flutterwave checkBillStatus error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Unable to confirm bill status',
            ];
        }
    }
}
