<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class WazobiaService
{
    private $baseUrl = 'https://wazobianet.com/api';
    private $apiToken;

    public function __construct()
    {
        $this->apiToken = Setting::where('key', 'wazobia_api_token')->first()?->value ?? '678920cac36059b2fe449f39f5e1394e9b5bda3c';
    }

    private function makeRequest($endpoint, $data = [], $method = 'POST', $isQuery = false)
    {
        try {
            $url = "{$this->baseUrl}{$endpoint}";

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => "Token {$this->apiToken}",
            ])->timeout(30);

            Log::info('Wazobia API Request', [
                'endpoint' => $endpoint,
                'method' => $method,
                'url' => $url,
            ]);

            if ($method === 'GET') {
                if ($isQuery) {
                    $response = $response->get($url, $data);
                } else {
                    $response = $response->get($url);
                }
            } else {
                $response = $response->post($url, $data);
            }

            if ($response->successful()) {
                Log::info('Wazobia API Success', [
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                ]);

                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            Log::error('Wazobia API Error', [
                'endpoint' => $endpoint,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => $response->json()['message'] ?? 'API request failed',
                'status' => $response->status(),
            ];
        } catch (Exception $e) {
            Log::error('Wazobia Service Exception', [
                'endpoint' => $endpoint,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getBalance()
    {
        return $this->makeRequest('/user', [], 'GET');
    }

    public function topupAirtime($network_id, $phone, $amount, $airtime_type = 'VTU', $ported = false)
    {
        return $this->makeRequest('/airtime/', [
            'network_id' => $network_id,
            'amount' => $amount,
            'airtime_type' => $airtime_type,
            'phone_number' => $phone,
            'ported' => $ported,
        ]);
    }

    public function subscribeData($network_id, $plan_id, $phone, $ported = false)
    {
        return $this->makeRequest('/data/', [
            'network_id' => $network_id,
            'plan_id' => $plan_id,
            'phone_number' => $phone,
            'ported' => $ported,
        ]);
    }

    public function buyDataCard($network_id, $plan_id, $quantity = 1, $name_on_card = null)
    {
        $data = [
            'network_id' => $network_id,
            'plan_id' => $plan_id,
            'quantity' => $quantity,
        ];

        if ($name_on_card) {
            $data['name_on_card'] = $name_on_card;
        }

        return $this->makeRequest('/datacard/', $data);
    }

    public function buyRechargeCard($network_id, $amount, $quantity = 1, $name_on_card = null)
    {
        $data = [
            'network_id' => $network_id,
            'amount' => $amount,
            'quantity' => $quantity,
        ];

        if ($name_on_card) {
            $data['name_on_card'] = $name_on_card;
        }

        return $this->makeRequest('/rechargecard/', $data);
    }

    public function validateSmartcard($cable, $smartcard)
    {
        return $this->makeRequest('/validate-smartcard/', [
            'cable' => $cable,
            'smartcard' => $smartcard,
        ], 'GET', true);
    }

    public function subscribeCableTV($cable_tv, $smartcard_number, $subscription_type = 'renew', $quantity = 1, $product_code = null, $phone_number = null)
    {
        $data = [
            'cable_tv' => $cable_tv,
            'smartcard_number' => $smartcard_number,
            'subscription_type' => $subscription_type,
            'quantity' => $quantity,
        ];

        if ($product_code) {
            $data['product_code'] = $product_code;
        }

        if ($phone_number) {
            $data['phone_number'] = $phone_number;
        }

        return $this->makeRequest('/cable-subscription/', $data);
    }

    public function validateMeter($company, $meter, $type = 'prepaid')
    {
        return $this->makeRequest('/validate-meter/', [
            'company' => $company,
            'meter' => $meter,
            'type' => $type,
        ], 'GET', true);
    }

    public function payElectricityBill($company_code, $meter_number, $meter_type = 'prepaid', $amount, $phone_number = null)
    {
        $data = [
            'company_code' => $company_code,
            'meter_number' => $meter_number,
            'meter_type' => $meter_type,
            'amount' => $amount,
        ];

        if ($phone_number) {
            $data['phone_number'] = $phone_number;
        }

        return $this->makeRequest('/electricity-payment/', $data);
    }

    public function activateCUG($network_id, $plan_id, $phone_numbers, $phone_number1 = null, $nin_number1 = null, $phone_number2 = null, $nin_number2 = null)
    {
        $data = [
            'network_id' => $network_id,
            'plan_id' => $plan_id,
        ];

        if ($phone_numbers) {
            $data['phone_numbers'] = $phone_numbers;
        } else {
            if ($phone_number1) {
                $data['phone_number1'] = $phone_number1;
            }
            if ($nin_number1) {
                $data['nin_number1'] = $nin_number1;
            }
            if ($phone_number2) {
                $data['phone_number2'] = $phone_number2;
            }
            if ($nin_number2) {
                $data['nin_number2'] = $nin_number2;
            }
        }

        return $this->makeRequest('/cug/', $data);
    }

    public function sendBulkSMS($sender_id, $recipients, $message, $route = 2)
    {
        return $this->makeRequest('/bulksms/', [
            'sender_id' => $sender_id,
            'recipients' => $recipients,
            'message' => $message,
            'route' => $route,
        ]);
    }

    public function buyExamPins($exam_id, $quantity = 1)
    {
        return $this->makeRequest('/epins/', [
            'exam_id' => $exam_id,
            'quantity' => $quantity,
        ]);
    }

    public function getNetworks()
    {
        return [
            [
                'id' => 1,
                'name' => 'MTN',
                'code' => 'mtn',
            ],
            [
                'id' => 2,
                'name' => 'GLO',
                'code' => 'glo',
            ],
            [
                'id' => 3,
                'name' => '9MOBILE',
                'code' => '9mobile',
            ],
            [
                'id' => 4,
                'name' => 'AIRTEL',
                'code' => 'airtel',
            ],
        ];
    }

    public function getDataPlans($network_id)
    {
        $plans = [
            1 => [ 
                ['id' => 64, 'size' => '50.0MB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 64, 'network_id' => 1],
                ['id' => 65, 'size' => '150.0MB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 65, 'network_id' => 1],
                ['id' => 66, 'size' => '250.0MB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 66, 'network_id' => 1],
                ['id' => 84, 'size' => '100.0MB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 84, 'network_id' => 1],
                ['id' => 85, 'size' => '500.0MB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 85, 'network_id' => 1],
                ['id' => 86, 'size' => '1.0GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 86, 'network_id' => 1],
                ['id' => 87, 'size' => '1.5GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 87, 'network_id' => 1],
                ['id' => 88, 'size' => '2.0GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 88, 'network_id' => 1],
                ['id' => 89, 'size' => '2.5GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 89, 'network_id' => 1],
                ['id' => 90, 'size' => '3.0GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 90, 'network_id' => 1],
                ['id' => 91, 'size' => '4.0GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 91, 'network_id' => 1],
                ['id' => 92, 'size' => '5.0GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 92, 'network_id' => 1],
                ['id' => 93, 'size' => '10.0GB', 'validity' => '1 Month', 'type' => 'CG Lite', 'plan_id' => 93, 'network_id' => 1],
                ['id' => 13, 'size' => '500.0MB', 'validity' => '1 Week', 'type' => 'CG', 'plan_id' => 13, 'network_id' => 1],
                ['id' => 14, 'size' => '1.0GB', 'validity' => '1 Week', 'type' => 'CG', 'plan_id' => 14, 'network_id' => 1],
                ['id' => 15, 'size' => '2.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 15, 'network_id' => 1],
                ['id' => 16, 'size' => '3.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 16, 'network_id' => 1],
                ['id' => 17, 'size' => '5.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 17, 'network_id' => 1],
                ['id' => 18, 'size' => '10.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 18, 'network_id' => 1],
                ['id' => 19, 'size' => '15.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 19, 'network_id' => 1],
                ['id' => 20, 'size' => '20.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 20, 'network_id' => 1],
                ['id' => 21, 'size' => '40.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 21, 'network_id' => 1],
                ['id' => 22, 'size' => '75.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 22, 'network_id' => 1],
                ['id' => 23, 'size' => '100.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 23, 'network_id' => 1],
            ],
            2 => [
                ['id' => 67, 'size' => '200.0MB', 'validity' => '30 Days', 'type' => 'CG', 'plan_id' => 67, 'network_id' => 2],
                ['id' => 68, 'size' => '500.0MB', 'validity' => '30 Days', 'type' => 'CG', 'plan_id' => 68, 'network_id' => 2],
                ['id' => 69, 'size' => '1.0GB', 'validity' => '30 Days', 'type' => 'CG', 'plan_id' => 69, 'network_id' => 2],
                ['id' => 70, 'size' => '2.0GB', 'validity' => '30 Days', 'type' => 'CG', 'plan_id' => 70, 'network_id' => 2],
                ['id' => 71, 'size' => '3.0GB', 'validity' => '30 Days', 'type' => 'CG', 'plan_id' => 71, 'network_id' => 2],
                ['id' => 72, 'size' => '5.0GB', 'validity' => '30 Days', 'type' => 'CG', 'plan_id' => 72, 'network_id' => 2],
                ['id' => 73, 'size' => '10.0GB', 'validity' => '30 Days', 'type' => 'CG', 'plan_id' => 73, 'network_id' => 2],
            ],
            3 => [
                ['id' => 74, 'size' => '100.0MB', 'validity' => '1 month', 'type' => 'SME', 'plan_id' => 74, 'network_id' => 3],
                ['id' => 75, 'size' => '300.0MB', 'validity' => '1 month', 'type' => 'SME', 'plan_id' => 75, 'network_id' => 3],
                ['id' => 76, 'size' => '500.0MB', 'validity' => '1 month', 'type' => 'SME', 'plan_id' => 76, 'network_id' => 3],
                ['id' => 77, 'size' => '500.0MB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 77, 'network_id' => 3],
                ['id' => 78, 'size' => '1.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 78, 'network_id' => 3],
                ['id' => 79, 'size' => '1.5GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 79, 'network_id' => 3],
                ['id' => 80, 'size' => '2.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 80, 'network_id' => 3],
                ['id' => 81, 'size' => '2.5GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 81, 'network_id' => 3],
                ['id' => 82, 'size' => '3.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 82, 'network_id' => 3],
                ['id' => 83, 'size' => '4.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 83, 'network_id' => 3],
                ['id' => 94, 'size' => '10.0GB', 'validity' => '1 month', 'type' => 'CG', 'plan_id' => 94, 'network_id' => 3],
            ],
            4 => [
                ['id' => 24, 'size' => '100.0MB', 'validity' => '1 Day', 'type' => 'CG', 'plan_id' => 24, 'network_id' => 4],
                ['id' => 25, 'size' => '300.0MB', 'validity' => '1 Day', 'type' => 'CG', 'plan_id' => 25, 'network_id' => 4],
                ['id' => 26, 'size' => '500.0MB', 'validity' => '1 Week', 'type' => 'CG', 'plan_id' => 26, 'network_id' => 4],
                ['id' => 27, 'size' => '1.0GB', 'validity' => '1 Week', 'type' => 'CG', 'plan_id' => 27, 'network_id' => 4],
                ['id' => 28, 'size' => '2.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 28, 'network_id' => 4],
                ['id' => 29, 'size' => '6.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 29, 'network_id' => 4],
                ['id' => 30, 'size' => '10.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 30, 'network_id' => 4],
                ['id' => 31, 'size' => '18.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 31, 'network_id' => 4],
                ['id' => 32, 'size' => '25.0GB', 'validity' => '1 Month', 'type' => 'CG', 'plan_id' => 32, 'network_id' => 4],
            ],
        ];

        return $plans[$network_id] ?? [];
    }

    public function getCableProviders()
    {
        return [
            ['id' => 1, 'name' => 'DStv', 'code' => 'dstv'],
            ['id' => 2, 'name' => 'GoTV', 'code' => 'gotv'],
            ['id' => 3, 'name' => 'Startimes', 'code' => 'startimes'],
            ['id' => 4, 'name' => 'Showmax', 'code' => 'showmax'],
        ];
    }

    public function getCablePlans($provider_code)
    {
        $plans = [
            'dstv' => [
                ['code' => 'padi', 'name' => 'DsTV Padi', 'product_code' => 'dstv-padi', 'price' => 4400],
                ['code' => 'yanga', 'name' => 'DsTV Yanga', 'product_code' => 'dstv-yanga', 'price' => 6000],
                ['code' => 'confam', 'name' => 'Dstv Confam', 'product_code' => 'dstv-confam', 'price' => 11000],
                ['code' => 'compact', 'name' => 'DStv Compact', 'product_code' => 'dstv-compact', 'price' => 19000],
                ['code' => 'compact-plus', 'name' => 'DStv Compact Plus', 'product_code' => 'dstv-compact-plus', 'price' => 30000],
                ['code' => 'premium', 'name' => 'DStv Premium', 'product_code' => 'dstv-premium', 'price' => 44500],
            ],
            'gotv' => [
                ['code' => 'smallie-monthly', 'name' => 'GOtv Smallie Monthly', 'product_code' => 'gotv-smallie-monthly', 'price' => 1900],
                ['code' => 'jinja', 'name' => 'GOtv Jinja', 'product_code' => 'gotv-jinja', 'price' => 3900],
                ['code' => 'jolli', 'name' => 'GOtv Jolli', 'product_code' => 'gotv-jolli', 'price' => 5800],
                ['code' => 'max', 'name' => 'GOtv Max', 'product_code' => 'gotv-max', 'price' => 8500],
                ['code' => 'supa', 'name' => 'GOtv Supa', 'product_code' => 'gotv-supa', 'price' => 11400],
            ],
            'startimes' => [
                ['code' => 'nova-daily', 'name' => 'Startimes Nova - 1 Day', 'product_code' => 'startimes-nova-daily', 'price' => 150],
                ['code' => 'basic-daily', 'name' => 'Startimes Basic (Antenna) - 1 Day', 'product_code' => 'startimes-basic-daily', 'price' => 300],
                ['code' => 'smart-daily', 'name' => 'Startimes Smart (Dish) - 1 Day', 'product_code' => 'startimes-smart-daily', 'price' => 350],
                ['code' => 'nova', 'name' => 'Startimes Nova - 1 Month', 'product_code' => 'startimes-nova', 'price' => 2100],
                ['code' => 'basic', 'name' => 'Startimes Basic (Antenna) - 1 Month', 'product_code' => 'startimes-basic', 'price' => 4000],
                ['code' => 'smart', 'name' => 'Startimes Smart (Dish) - 1 Month', 'product_code' => 'startimes-smart', 'price' => 5100],
                ['code' => 'classic', 'name' => 'Startimes Classic (Antenna) - 1 Month', 'product_code' => 'startimes-classic', 'price' => 6000],
                ['code' => 'special-monthly', 'name' => 'Startimes Special (Dish) - 1 Month', 'product_code' => 'startimes-special-monthly', 'price' => 7400],
                ['code' => 'super', 'name' => 'Startimes Super (Dish) - 1 Month', 'product_code' => 'startimes-super', 'price' => 9800],
            ],
            'showmax' => [
                ['code' => 'mobile-only', 'name' => 'Showmax Mobile Only', 'product_code' => 'showmax-mobile-only', 'price' => 2000],
                ['code' => 'full', 'name' => 'Showmax Full', 'product_code' => 'showmax-full', 'price' => 4500],
                ['code' => 'sports-full', 'name' => 'Showmax Sports Full', 'product_code' => 'showmax-sports-full', 'price' => 6300],
            ],
        ];

        return $plans[$provider_code] ?? [];
    }

    public function getElectricityProviders()
    {
        return [
            ['id' => 1, 'name' => 'IKEDC', 'code' => 'ikeja-electric'],
            ['id' => 2, 'name' => 'EKEDC', 'code' => 'eko-electric'],
            ['id' => 3, 'name' => 'KEDCO', 'code' => 'kano-electric'],
            ['id' => 4, 'name' => 'PHED', 'code' => 'portharcourt-electric'],
            ['id' => 5, 'name' => 'JED', 'code' => 'jos-electric'],
            ['id' => 6, 'name' => 'IBEDC', 'code' => 'ibadan-electric'],
            ['id' => 7, 'name' => 'KAEDCO', 'code' => 'kaduna-electric'],
            ['id' => 8, 'name' => 'AEDC', 'code' => 'abuja-electric'],
            ['id' => 9, 'name' => 'EEDC', 'code' => 'enugu-electric'],
            ['id' => 10, 'name' => 'BEDC', 'code' => 'benin-electric'],
            ['id' => 11, 'name' => 'YEDC', 'code' => 'yola-electric'],
        ];
    }

    public function getNetworkIdByCode($code)
    {
        $networks = [
            'mtn' => 1,
            'glo' => 2,
            '9mobile' => 3,
            'airtel' => 4,
        ];

        return $networks[strtolower($code)] ?? null;
    }

    public function getCableProviderByCode($code)
    {
        $providers = [
            'dstv' => 'dstv',
            'gotv' => 'gotv',
            'startimes' => 'startimes',
            'showmax' => 'showmax',
        ];

        return $providers[strtolower($code)] ?? null;
    }

    public function getElectricityProviderByCode($code)
    {
        $providers = [
            'ikeja-electric' => 'ikeja-electric',
            'eko-electric' => 'eko-electric',
            'kano-electric' => 'kano-electric',
            'portharcourt-electric' => 'portharcourt-electric',
            'jos-electric' => 'jos-electric',
            'ibadan-electric' => 'ibadan-electric',
            'kaduna-electric' => 'kaduna-electric',
            'abuja-electric' => 'abuja-electric',
            'enugu-electric' => 'enugu-electric',
            'benin-electric' => 'benin-electric',
            'yola-electric' => 'yola-electric',
        ];

        return $providers[strtolower($code)] ?? null;
    }
}
