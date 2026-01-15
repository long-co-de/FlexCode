<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use App\Models\Network;
use App\Models\DataPlan;
use Exception;

use function PHPUnit\Framework\stringContains;

class HusmodataService
{
    protected $apiKey;
    protected $apiUrl;

    public function __construct()
    {
        $this->apiKey = Setting::where('key', 'husmodata_api_key')->value('value');
        $base = 'https://husmodataapi.com/api/';
        $this->apiUrl = rtrim($base, '/');
    }

    protected function request(array $headers = [], array $options = [])
    {
        $request = Http::withHeaders($headers);
        // if (!app()->environment('production')) {
        $request = $request->withoutVerifying();
        // }
        if (!empty($options)) {
            $request = $request->withOptions($options);
        }

        return $request;
    }

    /**
     * Get account balance
     *
     * @return array
     */

    function getNetWorkId($network)
    {
        switch ($network) {
            case 'mtn':
                return 1;
                break;
            case 'airtel':
                return 4;
                break;
            case 'glo':
                return 2;
                break;
            case '9mobile':
                return 3;
                break;
            default:
                return 4;
                break;
        }
    }
    public function getBalance()
    {
        try {
            // First try the /balance endpoint
            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get($this->apiUrl . '/user');
            Log::info('Husmodata API balance response', [
                'status' => $response->status(),
                'body' => $response->json(),
                'url' => $this->apiUrl . '/user'
            ]);
            // if ($response->successful()) {
            //     return [
            //         'success' => true,
            //         'data' => $response->json(),
            //     ];
            // }

            // If that fails, try getting balance from the user endpoint
            $userInfo = $this->getUserInfo();
            if ($userInfo['success'] && isset($userInfo['user']['Account_Balance'])) {
                return [
                    'success' => true,
                    'data' => [
                        'balance' => $userInfo['user']['Account_Balance'],
                        'wallet_balance' => $userInfo['user']['wallet_balance'] ?? 0,
                        'bonus_balance' => $userInfo['user']['bonus_balance'] ?? 0,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to get balance',
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider',
            ];
        }
    }

    /**
     * Get virtual account details
     *
     * @return array
     */
    public function getVirtualAccountDetails()
    {
        try {
            $userInfo = $this->getUserInfo();

            if ($userInfo['success']) {
                $user = $userInfo['user'];
                $virtualAccounts = [];

                // Check for reserved account
                if (isset($user['reservedaccountNumber']) && isset($user['reservedbankName'])) {
                    $virtualAccounts[] = [
                        'account_number' => $user['reservedaccountNumber'],
                        'bank_name' => $user['reservedbankName'],
                        'account_name' => $user['FullName'] ?? 'N/A',
                        'type' => 'Reserved Account',
                    ];
                }

                // Check for bank accounts
                if (isset($user['bank_accounts']) && isset($user['bank_accounts']['accounts'])) {
                    foreach ($user['bank_accounts']['accounts'] as $account) {
                        $virtualAccounts[] = [
                            'account_number' => $account['accountNumber'] ?? 'N/A',
                            'bank_name' => $account['bankName'] ?? 'N/A',
                            'account_name' => $account['accountName'] ?? 'N/A',
                            'bank_code' => $account['bankCode'] ?? 'N/A',
                            'type' => 'Virtual Account',
                        ];
                    }
                }

                return [
                    'success' => true,
                    'data' => [
                        'virtual_accounts' => $virtualAccounts,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to get virtual account details',
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider',
            ];
        }
    }

    /**
     * Get available networks
     *
     * @return array
     */
    public function getNetworks()
    {
        try {
            // The API doesn't have a separate endpoint for networks
            // Instead, we'll extract network information from the data plans response
            $endpoint = 'https://husmodataapi.com/api/network/';

            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->get($endpoint);

            if ($response->successful()) {
                $responseData = $response->json();

                // Log the response for debugging
                Log::info('Husmodata API network response', [
                    'status' => $response->status(),
                    'body' => json_encode(array_keys($responseData)),
                ]);

                // Extract networks from the response
                $networks = [];

                // The response contains network keys like MTN_PLAN, GLO_PLAN, etc.
                foreach (array_keys($responseData) as $networkKey) {
                    // Extract network name from the key (e.g., MTN from MTN_PLAN)
                    $networkName = str_replace('_PLAN', '', $networkKey);

                    // Create a network object
                    $networks[] = [
                        'name' => $networkName,
                        'code' => $networkName,
                        'logo' => null, // No logo provided in the API
                    ];
                }

                return [
                    'success' => true,
                    'data' => $networks,
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to get networks',
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get data plans for a network
     *
     * @param string $networkCode
     * @return array
     */
    public function getDataPlans($networkCode)
    {
        try {
            $endpoint = 'https://husmodataapi.com/api/network/';

            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->get($endpoint);

            if ($response->successful()) {
                $responseData = $response->json();

                // Log the response for debugging
                Log::info('Husmodata API data plans response', [
                    'status' => $response->status(),
                    'networkCode' => $networkCode,
                    'available_keys' => json_encode(array_keys($responseData)),
                ]);

                // The network code needs to be appended with _PLAN to match the API response format
                $networkKey = $networkCode . '_PLAN';

                // Check if the network exists in the response
                if (isset($responseData[$networkKey])) {
                    $plans = $responseData[$networkKey];

                    // Log the first plan for debugging
                    if (count($plans) > 0) {
                        Log::info('Sample raw plan data from API:', [
                            'plan' => $plans[0]
                        ]);
                    }

                    // Transform the plans to match our expected format
                    $transformedPlans = [];
                    foreach ($plans as $plan) {
                        // Skip if required fields are missing
                        if (!isset($plan['dataplan_id']) || !isset($plan['plan_amount'])) {
                            Log::warning('Skipping plan with missing required fields: ' . json_encode($plan));
                            continue;
                        }

                        $transformedPlans[] = [
                            'code' => $plan['dataplan_id'],
                            'name' => $plan['plan'] ?? 'Unknown Plan',
                            'price' => $plan['plan_amount'],
                            'validity' => $plan['month_validate'] ?? '30 days',
                            'data_amount' => $plan['plan'] ?? 'Unknown',
                            'plan_type' => $plan['plan_type'] ?? 'REGULAR',
                        ];
                    }

                    return [
                        'success' => true,
                        'data' => $transformedPlans,
                    ];
                }

                // If the specific network key is not found, try to find any plans for this network
                // Some APIs might have a different structure or naming convention
                foreach (array_keys($responseData) as $key) {
                    if (stripos($key, $networkCode) !== false) {
                        $plans = $responseData[$key];

                        // Transform the plans to match our expected format
                        $transformedPlans = [];
                        foreach ($plans as $plan) {
                            // Skip if required fields are missing
                            if (!isset($plan['dataplan_id']) || !isset($plan['plan_amount'])) {
                                Log::warning('Skipping plan with missing required fields: ' . json_encode($plan));
                                continue;
                            }

                            $transformedPlans[] = [
                                'code' => $plan['dataplan_id'],
                                'name' => $plan['plan'] ?? 'Unknown Plan',
                                'price' => $plan['plan_amount'],
                                'validity' => $plan['month_validate'] ?? '30 days',
                                'data_amount' => $plan['plan'] ?? 'Unknown',
                                'plan_type' => $plan['plan_type'] ?? 'REGULAR',
                            ];
                        }

                        return [
                            'success' => true,
                            'data' => $transformedPlans,
                        ];
                    }
                }

                // If we still haven't found any plans, return an empty array instead of an error
                // This allows the sync process to continue for other networks
                Log::warning('No data plans found for network: ' . $networkCode);
                return [
                    'success' => true,
                    'data' => [],
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to get data plans',
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Buy airtime
     *
     * @param string $phone
     * @param string $network
     * @param float $amount
     * @param string $reference
     * @param string $airtimeType VTU, AWOOF, SHARE, or SELL
     * @return array
     */
    public function buyAirtime($phone, $network, $amount, $reference, $airtimeType = 'VTU', $ported = false)
    {
        $network = $this->getNetWorkId($network);
        try {
            // Log the request for debugging
            Log::info('Sending airtime purchase request to Husmodata API', [
                'phone' => $phone,
                'network' => $network,
                'amount' => $amount,
                'reference' => $reference,
                'airtime_type' => $airtimeType,
                'ported_number' => $ported,
            ]);

            // Use the correct endpoint for the API
            $endpoint = 'https://husmodataapi.com/api/topup/';

            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($endpoint, [
                'network' => $network,
                'amount' => $amount,
                'mobile_number' => $phone,
                'Ported_number' => true,
                'airtime_type' => $airtimeType,
                'Ported_number' => false,
                'reference' => $reference, // Adding reference for tracking
            ]);

            // Log the response for debugging
            Log::info('Husmodata API airtime purchase response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                $responseData = $response->json();

                // Check for specific success indicators in the response
                $isSuccess = isset($responseData['Status']) &&
                    (strtolower($responseData['Status']) === 'success' ||
                        strtolower($responseData['Status']) === 'successful');

                 if ($isSuccess) {
                    return [
                        'success' => true,
                        'data' => $responseData['data'] ?? $responseData,
                        'message' => $responseData['api_response'] ?? 'Data purchase successful',
                    ];
                } else {
                    // The request was successful but the operation failed 
                    if (stringContains($responseData['error'][0] ?? '', 'balance')) {
                        return [
                            'success' => false,
                            'message' => $responseData['error'][0] ?? 'to many request at the moment, please try again later.',
                            'response' => $responseData,
                        ];
                    }
                }
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'to many request at the moment, please try again later.',
                'status_code' => $response->status(),
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => '  to many request at the moment, please try again later' . $e->getMessage(),
            ];
        }
    }

    /**
     * Buy data
     *
     * @param string $phone
     * @param string $network
     * @param string $planCode
     * @param string $reference
     * @return array
     */
    public function buyData($phone, $network, $planCode, $reference, $ported)
    {
        $network = $this->getNetWorkId($network);
        try {
            // Get the data plan from the database to use the correct dataplan_id
            $dataPlan = \App\Models\DataPlan::where('code', $planCode)->whereHas('network', function ($q) use ($network) {
                $q->where('code', $network);
            })->first();

            // Use dataplan_id if available, otherwise fall back to code
            $apiPlanCode = ($dataPlan && $dataPlan->dataplan_id) ? $dataPlan->dataplan_id : $planCode;

            // Log the request for debugging
            Log::info('Sending data purchase request to Husmodata API', [
                'phone' => $phone,
                'network' => $network,
                'plan_code' => $planCode,
                'api_plan_code' => $apiPlanCode,
                'reference' => $reference,
                'ported_number' => $ported,
            ]);

            // Use the correct endpoint for the API
            $endpoint = 'https://husmodataapi.com/api/data/';

            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($endpoint, [
                'network' => $network,
                'mobile_number' => $phone,
                'plan' => $apiPlanCode,
                'Ported_number' => $ported ?? false,
                'reference' => $reference, // Adding reference for tracking
            ]);

            // Log the response for debugging
            Log::info('Husmodata API data purchase response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                $responseData = $response->json();

                // Check for specific success indicators in the response
                $isSuccess = isset($responseData['Status']) &&
                    (strtolower($responseData['Status']) === 'success' ||
                        strtolower($responseData['Status']) === 'successful');

                if ($isSuccess) {
                    return [
                        'success' => true,
                        'data' => $responseData['data'] ?? $responseData,
                        'message' => $responseData['api_response'] ?? 'Data purchase successful',
                    ];
                } else {
                    // The request was successful but the operation failed
                    if (stringContains($responseData['error'][0] ?? '', 'balance')) {
                        return [
                            'success' => false,
                            'message' => $responseData['error'][0] ?? 'to many request at the moment, please try again later.',
                            'response' => $responseData,
                        ];
                    }
                }
            }

            return [
                'success' => false,
                'message' =>  'to many request at the moment, please try again later',
                'status_code' => $response->status(),
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'to many request at the moment, please try again later' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify transaction status
     *
     * @param string $reference
     * @return array
     */
    public function verifyTransaction($reference)
    {
        try {
            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get($this->apiUrl . '/transaction/' . $reference);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to verify transaction',
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider',
            ];
        }
    }

    /**
     * Calculate selling price based on cost price and profit percentage
     *
     * @param float $costPrice
     * @param string $serviceType (airtime, data, cable, electricity)
     * @return float
     */
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
            default:
                $profitPercentage = 0;
        }

        $profitAmount = ($costPrice * $profitPercentage) / 100;
        $sellingPrice = $costPrice + $profitAmount;

        return round($sellingPrice, 2);
    }

    /**
     * Get user information from Husmodata API
     *
     * @return array
     */
    public function getUserInfo()
    {
        try {
            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get($this->apiUrl . '/user');

            if ($response->successful()) {
                $responseData = $response->json();

                // Extract user data
                $userData = $responseData['user'] ?? [];

                // Extract notification message
                $notification = $responseData['notification']['message'] ?? null;

                // Extract data plans
                $dataPlans = $responseData['Dataplans'] ?? [];

                // Extract cable plans
                $cablePlans = $responseData['Cable'] ?? [];

                return [
                    'success' => true,
                    'user' => $userData,
                    'notification' => $notification,
                    'data_plans' => $dataPlans,
                    'cable_plans' => $cablePlans,
                    'raw_response' => $responseData,
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to get user information',
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider',
            ];
        }
    }

    /**
     * Get all data plans from Husmodata API
     *
     * @param bool $storeInDatabase Whether to store the response in the database
     * @return array
     */
    public function getAllDataPlans($storeInDatabase = false)
    {
        try {
            // First try the /get/network/ endpoint
            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get($this->apiUrl . '/get/network/');

            // If that fails, try getting data from the user endpoint which also contains data plans
            if (!$response->successful()) {
                $userResponse = $this->getUserInfo();

                if ($userResponse['success'] && isset($userResponse['data_plans'])) {
                    $responseData = $userResponse['data_plans'];

                    // Store in database if requested
                    if ($storeInDatabase && !empty($responseData)) {
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
            }

            $responseData = $response->json();

            // Store in database if requested
            if ($storeInDatabase && !empty($responseData)) {
                $this->storeDataPlansInDatabase($responseData);
            }

            return [
                'success' => true,
                'data' => $responseData,
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider',
            ];
        }
    }

    /**
     * Store data plans from API response in the database
     *
     * @param array $responseData
     * @return void
     */
    public function storeDataPlansInDatabase($responseData)
    {
        try {
            // Check if the response has the expected structure
            if (empty($responseData)) {
                Log::error('Empty response data received from API');
                return;
            }

            // Process each network's plans
            foreach ($responseData as $networkKey => $plans) {
                // Skip if not a plan array (could be other data in the response)
                if (!is_array($plans) || empty($plans)) {
                    continue;
                }

                // Extract network code from the key (e.g., "MTN_PLAN" -> "MTN")
                $networkCode = str_replace('_PLAN', '', $networkKey);

                // Find or create the network
                $network = Network::firstOrCreate(
                    ['code' => strtolower($networkCode)],
                    [
                        'name' => $networkCode,
                        'is_active' => true
                    ]
                );

                // Process each plan
                foreach ($plans as $planData) {
                    // Skip if required fields are missing
                    if (!isset($planData['dataplan_id']) || !isset($planData['plan_amount'])) {
                        Log::warning('Skipping plan with missing required fields: ' . json_encode($planData));
                        continue;
                    }

                    // Create or update the data plan
                    $dataPlan = DataPlan::updateOrCreate(
                        [
                            'network_id' => $network->id,
                            'dataplan_id' => $planData['dataplan_id']
                        ],
                        [
                            'name' => ($planData['plan_network'] ?? $networkCode) . ' ' . ($planData['plan'] ?? ''),
                            'code' => $planData['dataplan_id'],
                            'plan_type' => $planData['plan_type'] ?? 'UNKNOWN',
                            'price' => floatval($planData['plan_amount']),
                            'data_amount' => $planData['plan'] ?? '',
                            'validity' => $planData['month_validate'] ?? '',
                            'is_active' => true,
                            'api_response' => $planData,
                            'last_api_update' => now()
                        ]
                    );

                    // Update the selling price based on plan type profit percentage
                    try {
                        $dataPlan->updateSellingPrice();
                    } catch (Exception $e) {
                        Log::error('Error updating selling price for plan ID ' . $dataPlan->id . ': ' . $e->getMessage());
                        // Set a default selling price if the calculation fails
                        $dataPlan->selling_price = $dataPlan->price * 1.05; // Default 5% markup
                        $dataPlan->save();
                    }
                }
            }

            Log::info('Data plans updated from API successfully');
        } catch (Exception $e) {
            Log::error('Error storing data plans in database: ' . $e->getMessage());
        }
    }

    /**
     * Get data plans by plan type (SME, GIFTING, CORPORATE GIFTING, etc.)
     * Based on the sample data in apitestdata/user.json
     *
     * @param string $network Network code (e.g., MTN, GLO, AIRTEL, 9MOBILE)
     * @param string $planType Plan type (e.g., SME, GIFTING, CORPORATE GIFTING)
     * @return array
     */
    public function getDataPlansByType($network, $planType)
    {
        try {
            // First get all data plans
            $allPlans = $this->getAllDataPlans();

            if (!$allPlans['success']) {
                return $allPlans;
            }

            $networkKey = $network . '_PLAN';
            $filteredPlans = [];

            // Check if the network exists in the response
            if (isset($allPlans['data'][$networkKey])) {
                // Filter plans by plan type
                foreach ($allPlans['data'][$networkKey] as $plan) {
                    if ($plan['plan_type'] === $planType) {
                        $filteredPlans[] = $plan;
                    }
                }
            }

            return [
                'success' => true,
                'data' => $filteredPlans,
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while processing data plans',
            ];
        }
    }

    /**
     * Get available exam payment options
     * Based on the sample data in apitestdata/user.json
     *
     * @return array
     */
    public function getExamOptions()
    {
        try {
            // This information is part of the user info response
            $userInfo = $this->getUserInfo();

            if (!$userInfo['success']) {
                return $userInfo;
            }

            return [
                'success' => true,
                'data' => $userInfo['data']['Exam'] ?? [],
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while getting exam options',
            ];
        }
    }

    /**
     * Get available bank accounts for payment
     * Based on the sample data in apitestdata/user.json
     *
     * @return array
     */
    public function getBankAccounts()
    {
        try {
            // This information is part of the user info response
            $userInfo = $this->getUserInfo();

            if (!$userInfo['success']) {
                return $userInfo;
            }

            return [
                'success' => true,
                'data' => $userInfo['data']['banks'] ?? [],
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while getting bank accounts',
            ];
        }
    }

    /**
     * Get network discount percentages
     * Based on the sample data in apitestdata/user.json
     *
     * @return array
     */
    public function getDiscountPercentages()
    {
        try {
            // This information is part of the user info response
            $userInfo = $this->getUserInfo();

            if (!$userInfo['success']) {
                return $userInfo;
            }

            return [
                'success' => true,
                'data' => [
                    'data_percentages' => $userInfo['data']['percentage'] ?? [],
                    'airtime_percentages' => $userInfo['data']['topuppercentage'] ?? [],
                ],
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while getting discount percentages',
            ];
        }
    }



    /**
     * Pay for exam (WAEC, NECO, etc.)
     * Based on the sample data structure
     *
     * @param string $examType Type of exam (e.g., WAEC, NECO)
     * @param string $reference Transaction reference
     * @param array $candidateInfo Candidate information
     * @return array
     */
    public function payForExam($examType, $reference, $candidateInfo)
    {
        try {
            $response = $this->request([
                'Authorization' => 'Token ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->post($this->apiUrl . '/exam-payment', [
                'exam_type' => $examType,
                'reference' => $reference,
                'candidate_info' => $candidateInfo,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data'] ?? [],
                    'message' => $response->json()['message'] ?? 'Exam payment successful',
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to process exam payment',
            ];
        } catch (Exception $e) {
            Log::error('Husmodata API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while connecting to the service provider',
            ];
        }
    }
}
