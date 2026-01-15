<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use Exception;

class VtpassService
{
    protected string $apiKey;
    protected string $secretKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = (string) Setting::where('key', 'vtpass_api_key')->value('value');
        $this->secretKey = (string) Setting::where('key', 'vtpass_secret_key')->value('value');
        $base = Setting::where('key', 'vtpass_api_url')->value('value') ?? 'https://vtpass.com/api';
        $this->baseUrl = rtrim($base, '/');
    }

    protected function client()
    {
        return Http::withHeaders([
            'api-key' => $this->apiKey,
            'secret-key' => $this->secretKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ]);
    }

    public function getVariations(string $serviceID): array
    {
        try {
            $url = $this->baseUrl . '/service-variations?serviceID=' . urlencode($serviceID);
            $response = $this->client()->get($url);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => ($data['code'] ?? '') === '000',
                    'data' => $data['content']['variations'] ?? [],
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['response_description'] ?? 'Failed to fetch variations',
            ];
        } catch (Exception $e) {
            Log::error('VTPass getVariations error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Unable to connect to VTPass',
            ];
        }
    }

    public function verifyCustomer(string $serviceID, string $billersCode, ?string $type = null): array
    {
        try {
            // Infer type when not provided
            if ($type === null) {
                $type = $this->inferVerifyType($serviceID);
            }

            $payload = [
                'serviceID' => $serviceID,
                'billersCode' => $billersCode,
            ];
            if ($type) {
                $payload['type'] = $type;
            }

            $response = $this->client()->post($this->baseUrl . '/merchant-verify', $payload);
            $json = $response->json();
            $ok = $response->successful() && (($json['code'] ?? '') === '000');

            return [
                'success' => $ok,
                'data' => $json['content']['Customer'] ?? ($json['content'] ?? []),
                'raw' => $json,
                'message' => $json['response_description'] ?? null,
            ];
        } catch (Exception $e) {
            Log::error('VTPass verifyCustomer error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Unable to verify customer on VTPass',
            ];
        }
    }

    public function pay(array $params): array
    {
        // Expected params: request_id, serviceID, billersCode, variation_code, amount, phone, (optional) type, others
        try {
            $response = $this->client()->post($this->baseUrl . '/pay', $params);
            $json = $response->json();
            $ok = $response->successful() && (($json['code'] ?? '') === '000');

            return [
                'success' => $ok,
                'data' => $json['content'] ?? [],
                'raw' => $json,
                'message' => $json['response_description'] ?? null,
            ];
        } catch (Exception $e) {
            Log::error('VTPass pay error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Payment request to VTPass failed',
            ];
        }
    }

    protected function inferVerifyType(string $serviceID): ?string
    {
        $tv = ['dstv', 'gotv', 'startimes'];
        $electricity = [
            'ikeja-electric', 'eko-electric', 'portharcourt-electric', 'kano-electric', 'jos-electric',
            'ibadan-electric', 'kaduna-electric', 'abuja-electric', 'benin-electric', 'enugu-electric'
        ];
        if (in_array(strtolower($serviceID), $tv, true)) return 'smartcardno';
        if (in_array(strtolower($serviceID), $electricity, true)) return 'meter';
        return null;
    }
}
