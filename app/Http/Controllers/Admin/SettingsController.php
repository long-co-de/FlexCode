<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Services\DatavendroService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $settings = Setting::first();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'apiDetails' => $this->getApiDetails(),
            'datavendro' => [
                'api_key' => Setting::where('key', 'datavendro_api_key')->value('value'),
                'api_url' => Setting::where('key', 'datavendro_api_url')->value('value'),
            ],
            'proSettings' => [
                'airtime_profit_percentage' => $settings->pro_airtime_profit_percentage,
                'data_profit_percentage' => $settings->pro_data_profit_percentage,
                'cable_profit_percentage' => $settings->pro_cable_profit_percentage,
                'electricity_profit_percentage' => $settings->pro_electricity_profit_percentage,
                'banner_templates' => json_decode($settings->pro_banner_templates, true)
            ]
        ]);
    }

    /**
     * Get API details including balance and virtual accounts
     *
     * @return array
     */
    private function getApiDetails()
    {
        $datavendroService = app(DatavendroService::class);
        $balanceResponse = $datavendroService->getBalance();
        // $virtualAccountResponse = $datavendroService->getVirtualAccountDetails(); // Not sure if datavendro has this

        return [
            'balance' => $balanceResponse['success'] ? $balanceResponse['data'] : null,
            'balanceError' => !$balanceResponse['success'] ? $balanceResponse['message'] : null,
            'virtualAccounts' => [], // $virtualAccountResponse['success'] ? $virtualAccountResponse['data']['virtual_accounts'] : [],
            'virtualAccountError' => null, // !$virtualAccountResponse['success'] ? $virtualAccountResponse['message'] : null,
            'lastChecked' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Update the settings.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request)
    {
        $settings = Setting::first();

        $request->validate([
            'site_name' => 'required|string|max:255',
            'site_description' => 'nullable|string|max:1000',
            'about_content' => 'nullable|string',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            // Datavendro
            'datavendro_api_key' => 'nullable|string',
            'datavendro_api_url' => 'nullable|url',
            // XixaPay
            'xixapay_api_key' => 'required|string',
            'xixapay_secret_key' => 'required|string',
            'xixapay_base_url' => 'required|url',
            'xixapay_business_id' => 'required|string',
            'xixapay_api_key' => 'required|string',
            'xixapay_secret_key' => 'required|string',
            'xixapay_base_url' => 'required|url',
            'xixapay_business_id' => 'required|string',
            'airtime_profit_percentage' => 'required|numeric|min:0',
            'data_profit_percentage' => 'required|numeric|min:0',
            'cable_profit_percentage' => 'required|numeric|min:0',
            'electricity_profit_percentage' => 'required|numeric|min:0',
            'airtime_to_cash_charge' => 'required|numeric|min:0|max:100',
            'referral_bonus_percentage' => 'required|numeric|min:0',
            'min_withdrawal_amount' => 'required|numeric|min:0',
            'virtual_bank_deposit_charge' => 'required|numeric|min:0',
            'card_payment_charge' => 'required|numeric|min:0',
            'online_payment_charge' => 'required|numeric|min:0',
            'maintenance_mode' => 'boolean',
            'pro_airtime_profit_percentage' => 'nullable|numeric|min:0|max:100',
            'pro_data_profit_percentage' => 'nullable|numeric|min:0|max:100',
            'pro_cable_profit_percentage' => 'nullable|numeric|min:0|max:100',
            'pro_electricity_profit_percentage' => 'nullable|numeric|min:0|max:100',
            'pro_banner_templates' => 'nullable|array'
        ]);

        // General settings
        Setting::set('site_name', $request->site_name, 'general', true);
        Setting::set('site_description', $request->site_description, 'general', true);
        Setting::set('about_content', $request->about_content, 'general', true);
        Setting::set('contact_email', $request->contact_email, 'general', true);
        Setting::set('contact_phone', $request->contact_phone, 'general', true);
        Setting::set('maintenance_mode', $request->maintenance_mode ? 'true' : 'false', 'general', true);

        // XixaPay settings
        Setting::set('xixapay_api_key', $request->xixapay_api_key, 'api', false);
        Setting::set('xixapay_secret_key', $request->xixapay_secret_key, 'api', false);
        Setting::set('xixapay_base_url', $request->xixapay_base_url, 'api', true);
        Setting::set('xixapay_business_id', $request->xixapay_business_id, 'api', true);

        // API settings
        // Datavendro settings
        if ($request->filled('datavendro_api_key')) {
            Setting::set('datavendro_api_key', $request->datavendro_api_key, 'api', false);
        }
        if ($request->filled('datavendro_api_url')) {
            Setting::set('datavendro_api_url', rtrim($request->datavendro_api_url, '/'), 'api', true);
        }

        // XixaPay settings
        Setting::set('xixapay_api_key', $request->xixapay_api_key, 'api', false);
        Setting::set('xixapay_secret_key', $request->xixapay_secret_key, 'api', false);
        Setting::set('xixapay_base_url', $request->xixapay_base_url, 'api', true);
        Setting::set('xixapay_business_id', $request->xixapay_business_id, 'api', true);

        // Profit margins
        Setting::set('airtime_profit_percentage', $request->airtime_profit_percentage, 'profit', true);
        Setting::set('data_profit_percentage', $request->data_profit_percentage, 'profit', true);
        Setting::set('cable_profit_percentage', $request->cable_profit_percentage, 'profit', true);
        Setting::set('electricity_profit_percentage', $request->electricity_profit_percentage, 'profit', true);
        Setting::set('airtime_to_cash_charge', $request->airtime_to_cash_charge, 'profit', true);

        // Payment charges
        Setting::set('virtual_bank_deposit_charge', $request->virtual_bank_deposit_charge, 'payment', true);
        Setting::set('card_payment_charge', $request->card_payment_charge, 'payment', true);
        Setting::set('online_payment_charge', $request->online_payment_charge, 'payment', true);

        // Referral system
        Setting::set('referral_bonus_percentage', $request->referral_bonus_percentage, 'referral', true);
        Setting::set('min_withdrawal_amount', $request->min_withdrawal_amount, 'referral', true);

        // Pro settings
        Setting::set('pro_airtime_profit_percentage', $request->pro_airtime_profit_percentage ?? 2);
        Setting::set('pro_data_profit_percentage', $request->pro_data_profit_percentage ?? 2);
        Setting::set('pro_cable_profit_percentage', $request->pro_cable_profit_percentage ?? 2);
        Setting::set('pro_electricity_profit_percentage', $request->pro_electricity_profit_percentage ?? 2);

        if ($request->has('pro_banner_templates')) {
            $settings->pro_banner_templates = json_encode($request->pro_banner_templates);
        }

        $settings->save();

        // Clear all settings cache
        Cache::flush();

        return redirect()->route('admin.settings')->with('success', 'Settings updated successfully');
    }

    /**
     * Test the XixaPay API connection.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function testXixaPayConnection()
    {
        try {
            $apiKey = Setting::where('key', 'xixapay_api_key')->value('value');
            $secretKey = Setting::where('key', 'xixapay_secret_key')->value('value');
            $baseUrl = Setting::where('key', 'xixapay_base_url')->value('value');

            if (!$apiKey || !$secretKey || !$baseUrl) {
                return redirect()->route('admin.settings')->with('error', 'XixaPay API credentials are not configured.');
            }

            // Make a simple API call to test the connection
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
                'api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->get($baseUrl . '/status');

            if ($response->successful()) {
                return redirect()->route('admin.settings')->with('success', 'XixaPay API connection successful.');
            }

            return redirect()->route('admin.settings')->with('error', 'XixaPay API connection failed: ' . ($response->json('message') ?? 'Unknown error'));
        } catch (\Exception $e) {
            return redirect()->route('admin.settings')->with('error', 'XixaPay API connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Test the API connection.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function testApiConnection()
    {
        $datavendroService = app(DatavendroService::class);
        $response = $datavendroService->getBalance();

        if ($response['success']) {
            return redirect()->route('admin.settings')->with('success', 'Datavendro API connection successful. Balance: ₦' . ($response['data']['balance'] ?? 'N/A'));
        }

        return redirect()->route('admin.settings')->with('error', 'Datavendro API connection failed: ' . ($response['message'] ?? 'Unknown error'));
    }
}
