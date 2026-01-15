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
                $isSuccess = isset($responseData['Status']) &&
                    (strtolower($responseData['Status']) === 'success' || strtolower($responseData['Status']) === 'successful');

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
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
                $isSuccess = isset($responseData['Status']) &&
                    (strtolower($responseData['Status']) === 'success' || strtolower($responseData['Status']) === 'successful');

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
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
                $isSuccess = isset($responseData['Status']) &&
                    (strtolower($responseData['Status']) === 'success' || strtolower($responseData['Status']) === 'successful');

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
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

    public function validateMeter($meterNumber, $discoName, $meterType)
    {
        try {
            // Mapping meterType to ID (PREPAID:1, POSTAID:2)
            $meterTypeId = (strtolower($meterType) === 'prepaid') ? 1 : 2;

            $params = [
                'meternumber' => $meterNumber,
                'disconame' => $discoName, // Datavendro requires full disco name
                'mtype' => $meterTypeId == 1 ? 'prepaid':   'postpaid'
            ];
            Log::info('Datavendro validateMeter Request', $params);
            $response = $this->request()->get($this->apiUrl . '/validatemeter', $params);
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

    public function payElectricityBill($meterNumber, $discoName, $amount, $meterType)
    {
        try {
            $meterTypeId = (strtolower($meterType) === 'prepaid') ? 1 : 2;

            $payload = [
                'disco_name' => $discoName,
                'amount' => $amount,
                'meter_number' => $meterNumber,
                'MeterType' => $meterTypeId
            ];
            Log::info('Datavendro payElectricityBill Request', $payload);
            $response = $this->request()->post($this->apiUrl . '/billpayment/', $payload);
            Log::info('Datavendro payElectricityBill Response', ['status' => $response->status(), 'data' => $response->json()]);

            if ($response->successful()) {
                $responseData = $response->json();
                $isSuccess = isset($responseData['Status']) &&
                    (strtolower($responseData['Status']) === 'success' || strtolower($responseData['Status']) === 'successful');

                return [
                    'success' => $isSuccess,
                    'data' => $responseData,
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

                $costPrice = floatval($planData['plan_amount']);
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

    public function verifyTransaction($id)
    {
        try {
            Log::info('Datavendro verifyTransaction Request', ['id' => $id]);
            $response = $this->request()->get($this->apiUrl . '/topup/' . $id);
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
