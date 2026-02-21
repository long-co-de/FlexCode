<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use App\Models\Network;
use App\Models\DataPlan;
use Exception;

class DatavendroService
{
    protected $apiKey;
    protected $apiUrl;

    private function extractStatus(array $responseData): ?string
    {
        $status = $responseData['Status'] ?? $responseData['status'] ?? null;
        if (is_string($status)) {
            return $status;
        }

        $innerData = $responseData['data'] ?? [];
        $status = $innerData['Status'] ?? $innerData['status'] ?? null;

        return is_string($status) ? $status : null;
    }

    private function isSuccessfulStatus(?string $status): bool
    {
        if ($status === null) {
            return false;
        }

        $status = strtolower($status);

        return $status === 'success' || $status === 'successful';
    }

    private function extractApiTransactionId(array $responseData): ?string
    {
        $innerData = $responseData['data'] ?? [];
        $id = $responseData['id']
            ?? $responseData['ident']
            ?? $responseData['transaction_id']
            ?? $innerData['id']
            ?? $innerData['ident']
            ?? $innerData['transaction_id']
            ?? null;

        if ($id === null || $id === '') {
            return null;
        }

        return (string) $id;
    }

    public function __construct()
    {
        $this->apiKey = Setting::where('key', 'datavendro_api_key')->value('value') ?? '8b0db02d232377ca7c7dd354e30b41a423f7201d';
        $base = Setting::where('key', 'datavendro_api_url')->value('value') ?? 'https://datavendor.ng/api/';
        $this->apiUrl = rtrim($base, '/');
    }

    protected function request(array $headers = [], array $options = [])
    {
        $request = Http::withHeaders(array_merge([
            'Authorization' => 'Token ' . $this->apiKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ], $headers));

        $request = $request->withoutVerifying();

        if (!empty($options)) {
            $request = $request->withOptions($options);
        }

        return $request;
    }

    public function getBalance()
    {
        try {
            Log::info('Datavendro getBalance Request');
            $response = $this->request()->get($this->apiUrl . '/user');
            Log::info('Datavendro getBalance Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                $data = $response->json();
                $userData = $data['user'] ?? [];

                return [
                    'success' => true,
                    'data' => [
                        'balance' => $userData['Account_Balance'] ?? 0,
                        'wallet_balance' => $userData['wallet_balance'] ?? 0,
                        'bonus_balance' => $userData['bonus_balance'] ?? 0,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to get balance',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider',
            ];
        }
    }

    public function getNetWorkId($network)
    {
        $network = strtolower($network);
        switch ($network) {
            case 'mtn':
                return 1;
            case 'glo':
                return 2;
            case '9mobile':
                return 3;
            case 'airtel':
                return 4;
            default:
                return 1;
        }
    }

    public function getDiscoId($discoName)
    {
        if (is_numeric($discoName)) {
            return (int)$discoName;
        }

        $disco = strtolower($discoName);
        // Mapping disco names to their IDs as per Datavendro API
        $discoMap = [
            'ikedc' => 1,
            'ikeja' => 1,
            'ikeja-electric' => 1,
            'ekedc' => 2,
            'eko' => 2,
            'eko-electric' => 2,
            'aedc' => 3,
            'abuja' => 3,
            'abuja-electric' => 3,
            'kedc' => 4,
            'kano' => 4,
            'kano-electric' => 4,
            'eedc' => 5,
            'enugu' => 5,
            'enugu-electric' => 5,
            'phedc' => 6,
            'portharcourt' => 6,
            'port-harcourt' => 6,
            'ibedc' => 7,
            'ibadan' => 7,
            'ibadan-electric' => 7,
            'kadc' => 8,
            'kaduna' => 8,
            'kaduna-electric' => 8,
            'jedc' => 9,
            'jos' => 9,
            'jos-electric' => 9,
            'bedc' => 10,
            'benin' => 10,
            'benin-electric' => 10,
            'yedc' => 12,
            'yola' => 12,
            'yola-electric' => 12,
        ];

        return $discoMap[$disco] ?? 1; // Default to Ikeja Electric if not found
    }

    public function buyAirtime($phone, $network, $amount, $reference, $airtimeType = 'VTU', $ported = false)
    {
        $networkId = $this->getNetWorkId($network);
        try {
            $payload = [
                'network' => $networkId,
                'amount' => $amount,
                'mobile_number' => $phone,
                'airtime_type' => $airtimeType,
                'Ported_number' => $ported ? 'true' : 'false',
            ];
            Log::info('Datavendro buyAirtime Request', $payload);
            $response = $this->request()->post($this->apiUrl . '/topup/', $payload);
            Log::info('Datavendro buyAirtime Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                $responseData = $response->json();
                $status = $this->extractStatus($responseData);
                $isSuccess = $this->isSuccessfulStatus($status);

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
                    'api_transaction_id' => $this->extractApiTransactionId($responseData),
                    'api_status' => $status,
                    'message' => $responseData['api_response'] ?? ($isSuccess ? 'Airtime purchase successful' : 'Airtime purchase failed'),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to purchase airtime',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    public function buyData($phone, $network, $planCode, $reference, $ported)
    {
        $networkId = $this->getNetWorkId($network);
        try {
            $payload = [
                'network' => $networkId,
                'mobile_number' => $phone,
                'plan' => is_numeric($planCode) ? (int)$planCode : $planCode,
                'Ported_number' => $ported ? 'true' : 'false',
            ];
            Log::info('Datavendro buyData Request', $payload);
            $response = $this->request()->post($this->apiUrl . '/data/', $payload);
            Log::info('Datavendro buyData Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                $responseData = $response->json();
                $status = $this->extractStatus($responseData);
                $isSuccess = $this->isSuccessfulStatus($status);

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
                    'api_transaction_id' => $this->extractApiTransactionId($responseData),
                    'api_status' => $status,
                    'message' => $responseData['api_response'] ?? ($isSuccess ? 'Data purchase successful' : 'Data purchase failed'),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to purchase data',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    public function validateIuc($smartCardNumber, $cableName)
    {
        try {
            $params = [
                'smart_card_number' => $smartCardNumber,
                'cablename' => $cableName
            ];
            Log::info('Datavendro validateIuc Request', $params);
            $response = $this->request()->get($this->apiUrl . '/validateiuc', $params);
            Log::info('Datavendro validateIuc Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'IUC validation failed',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    public function subscribeCable($smartCardNumber, $cableName, $cablePlan)
    {
        try {
            $payload = [
                'cablename' => $cableName,
                'cableplan' => $cablePlan,
                'smart_card_number' => $smartCardNumber,
            ];
            Log::info('Datavendro subscribeCable Request', $payload);
            $response = $this->request()->post($this->apiUrl . '/cablesub/', $payload);
            Log::info('Datavendro subscribeCable Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                $responseData = $response->json();
                $status = $this->extractStatus($responseData);
                $isSuccess = $this->isSuccessfulStatus($status);

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
                    'api_transaction_id' => $this->extractApiTransactionId($responseData),
                    'api_status' => $status,
                    'message' => $responseData['api_response'] ?? ($isSuccess ? 'Cable subscription successful' : 'Cable subscription failed'),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to process cable subscription',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    public function getDiscoFullName($discoName)
    {
        $disco = strtolower($discoName);
        $map = [
            'ikeja-electric' => 'Ikeja Electric',
            'eko-electric' => 'Eko Electric',
            'abuja-electric' => 'Abuja Electric',
            'kano-electric' => 'Kano Electric',
            'enugu-electric' => 'Enugu Electric',
            'port-harcourt-electric' => 'Port Harcourt Electric',
            'ibadan-electric' => 'Ibadan Electric',
            'kaduna-electric' => 'Kaduna Electric',
            'jos-electric' => 'Jos Electric',
            'benin-electric' => 'Benin Electric',
            'yola-electric' => 'Yola Electric',
            'ikedc' => 'Ikeja Electric',
            'ekedc' => 'Eko Electric',
            'aedc' => 'Abuja Electric',
            'kedc' => 'Kano Electric',
            'eedc' => 'Enugu Electric',
            'phedc' => 'Port Harcourt Electric',
            'ibedc' => 'Ibadan Electric',
            'kadc' => 'Kaduna Electric',
            'jedc' => 'Jos Electric',
            'bedc' => 'Benin Electric',
            'yedc' => 'Yola Electric',
        ];

        return $map[$disco] ?? ucwords(str_replace('-', ' ', $disco));
    }

    public function validateMeter($meterNumber, $discoName, $meterType)
    {
        try {
            $fullName = $this->getDiscoFullName($discoName);
            $meterTypeValue = (strtolower($meterType) === 'prepaid') ? 'PREPAID' : 'POSTPAID';

            $params = [
                'meternumber' => $meterNumber,
                'disconame' => $fullName,
                'mtype' => $meterTypeValue
            ];

            Log::info('Datavendro validateMeter Request', $params);

            // Try both API and AJAX endpoints if one fails, or just use the one provided by dev
            $url = str_replace('/api', '/ajax/validate_meter_number', $this->apiUrl);

            $response = $this->request()->get($url, $params);

            if (!$response->successful()) {
                // Fallback to standard API if AJAX fails
                $response = $this->request()->get($this->apiUrl . '/validatemeter', $params);
            }

            Log::info('Datavendro validateMeter Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Meter validation failed',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    public function payElectricityBill($meterNumber, $discoName, $amount, $meterType, $reference = null, $phone = null, $customerName = null, $customerAddress = null)
    {
        try {
            $meterTypeValue = (strtolower($meterType) === 'prepaid') ? "Prepaid" : "Postpaid";
            $discoId = $this->getDiscoId($discoName);

            $payload = [
                'disco_name' => (string)$discoId,
                'amount' => $amount,
                'meter_number' => $meterNumber,
                'MeterType' => $meterTypeValue,
                'Customer_Phone' => $phone,
                'customer_name' => $customerName,
                'customer_address' => $customerAddress,
            ];

            if (!empty($reference)) {
                $payload['request_id'] = $reference;
            }

            $payload = array_filter($payload, static function ($value) {
                return $value !== null && $value !== '';
            });

            Log::info('Datavendro payElectricityBill Request', $payload);
            $response = $this->request()->post($this->apiUrl . '/billpayment/', $payload);
            Log::info('Datavendro payElectricityBill Response', ['status' => $response->status(), 'data' => $response->json()]);
            if (!$response->successful()) {
                Log::warning('Datavendro payElectricityBill Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'headers' => $response->headers(),
                    'url' => $this->apiUrl . '/billpayment/',
                ]);
            }

            if ($response->successful()) {
                $responseData = $response->json();
                $status = $this->extractStatus($responseData);
                $isSuccess = $this->isSuccessfulStatus($status);

                // Extract data if it exists in the nested 'data' field
                $innerData = $responseData['data'] ?? [];

                // Try to find token in top level or nested data
                $token = $responseData['token'] ??
                         ($responseData['Token'] ??
                         ($responseData['POWERTOKEN'] ??
                         ($innerData['token'] ??
                         ($innerData['Token'] ??
                         ($innerData['POWERTOKEN'] ??
                         ($innerData['main_token'] ?? null))))));

                // Try to find units in top level or nested data
                $units = $responseData['units'] ??
                         ($responseData['Units'] ??
                         ($responseData['quantity'] ??
                         ($innerData['units'] ??
                         ($innerData['Units'] ??
                         ($innerData['quantity'] ?? null)))));

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
                    'token' => $token,
                    'units' => $units,
                    'api_transaction_id' => $this->extractApiTransactionId($responseData),
                    'api_status' => $status,
                    'message' => $responseData['api_response'] ?? ($isSuccess ? 'Electricity bill payment successful' : 'Electricity bill payment failed'),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to process bill payment',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    public function getAllDataPlans($storeInDatabase = false)
    {
        try {
            Log::info('Datavendro getAllDataPlans Request');
            $response = $this->request()->get($this->apiUrl . '/network/');
            Log::info('Datavendro getAllDataPlans Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                $responseData = $response->json();
                if ($storeInDatabase) {
                    $this->storeDataPlansInDatabase($responseData);
                }
                return [
                    'success' => true,
                    'data' => $responseData,
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to get data plans',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred',
            ];
        }
    }

    public function storeDataPlansInDatabase($responseData)
    {
        foreach ($responseData as $networkKey => $plans) {
            if (!is_array($plans)) continue;

            $networkCode = str_replace('_PLAN', '', $networkKey);
            $network = Network::where('code', strtolower($networkCode))->first();

            if (!$network) continue;

            foreach ($plans as $planData) {
                if (!isset($planData['dataplan_id'])) continue;

                $planName = $planData['plan'] ?? '';
                $planType = $planData['plan_type'] ?? 'UNKNOWN';

                // Skip CORPORATE GIFTING and SMS plans as they are not working or not needed
                if (
                    stripos($planType, 'CORPORATE GIFTING') !== false ||
                    stripos($planName, 'CORPORATE GIFTING') !== false ||
                    stripos($planType, 'SME') !== false ||
                    stripos($planName, 'SME') !== false
                ) {
                    continue;
                }

                $costPrice = floatval($planData['plan_amount']);

                // Skip plans with abnormally high prices (sanity check)
                if ($costPrice > 50000) {
                    Log::warning("Skipping plan with abnormal price", [
                        'plan_id' => $planData['dataplan_id'],
                        'name' => $planName,
                        'price' => $costPrice
                    ]);
                    continue;
                }

                $sellingPrice = $this->calculateSellingPrice($costPrice, 'data');

                DataPlan::updateOrCreate(
                    [
                        'network_id' => $network->id,
                        'dataplan_id' => $planData['dataplan_id']
                    ],
                    [
                        'name' => ($planData['plan_network'] ?? $networkCode) . ' ' . ($planData['plan'] ?? ''),
                        'code' => $planData['dataplan_id'],
                        'plan_type' => $planData['plan_type'] ?? 'UNKNOWN',
                        'price' => $costPrice,
                        'selling_price' => $sellingPrice,
                        'data_amount' => $planData['plan'] ?? '',
                        'validity' => $planData['month_validate'] ?? '',
                        'is_active' => true,
                    ]
                );
            }
        }
    }

    public function verifyTransaction($id,$url = 'topup')
    {
        try {
            Log::info('Datavendro verifyTransaction Request', ['id' => $id]);
            $response = $this->request()->get($this->apiUrl . '/' . $url . '/' . $id);
            Log::info('Datavendro verifyTransaction Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to verify transaction',
            ];
        } catch (Exception $e) {
            Log::error('Datavendro API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    public function syncProviders()
    {
        $providers = [
            ['name' => 'Ikeja Electric', 'code' => 'ikeja-electric', 'logo' => 'electricity/ikeja.png'],
            ['name' => 'Eko Electric', 'code' => 'eko-electric', 'logo' => 'electricity/eko.png'],
            ['name' => 'Abuja Electric', 'code' => 'abuja-electric', 'logo' => 'electricity/abuja.png'],
            ['name' => 'Kano Electric', 'code' => 'kano-electric', 'logo' => 'electricity/kano.png'],
            ['name' => 'Enugu Electric', 'code' => 'enugu-electric', 'logo' => 'electricity/enugu.png'],
            ['name' => 'Port Harcourt Electric', 'code' => 'port-harcourt-electric', 'logo' => 'electricity/phed.png'],
            ['name' => 'Ibadan Electric', 'code' => 'ibadan-electric', 'logo' => 'electricity/ibadan.png'],
            ['name' => 'Kaduna Electric', 'code' => 'kaduna-electric', 'logo' => 'electricity/kaduna.png'],
            ['name' => 'Jos Electric', 'code' => 'jos-electric', 'logo' => 'electricity/jos.png'],
            ['name' => 'Benin Electric', 'code' => 'benin-electric', 'logo' => 'electricity/benin.png'],
            ['name' => 'Yola Electric', 'code' => 'yola-electric', 'logo' => 'electricity/yola.png'],
        ];

        foreach ($providers as $provider) {
            \App\Models\ElectricityProvider::updateOrCreate(
                ['code' => $provider['code']],
                [
                    'name' => $provider['name'],
                    'logo' => $provider['logo'],
                    'is_active' => true,
                ]
            );
        }
    }

    public function calculateSellingPrice($costPrice, $serviceType)
    {
        $profitPercentage = 0;

        switch ($serviceType) {
            case 'airtime':
                $profitPercentage = Setting::where('key', 'airtime_profit_percentage')->value('value') ?? 2;
                break;
            case 'data':
                $profitPercentage = Setting::where('key', 'data_profit_percentage')->value('value') ?? 5;
                break;
            case 'cable':
                $profitPercentage = Setting::where('key', 'cable_profit_percentage')->value('value') ?? 3;
                break;
            case 'electricity':
                $profitPercentage = Setting::where('key', 'electricity_profit_percentage')->value('value') ?? 2;
                break;
        }

        return $costPrice + ($costPrice * $profitPercentage / 100);
    }
}
