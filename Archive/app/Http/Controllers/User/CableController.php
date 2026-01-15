<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CableProvider;
use App\Models\CablePlan;
use App\Models\Transaction;
use App\Models\Beneficiary;
use App\Services\VtpassService;
use App\Services\WazobiaService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class CableController extends Controller
{
    protected $vtpass;
    protected $wazobiaService;

    public function __construct(VtpassService $vtpass, WazobiaService $wazobiaService)
    {
        $this->vtpass = $vtpass;
        $this->wazobiaService = $wazobiaService;
    }

    /**
     * Display the cable subscription page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        $cableProviders = CableProvider::with('cablePlans')
            ->where('is_active', true)
            ->get();

        // Get user's cable beneficiaries
        $beneficiaries = Beneficiary::where('user_id', $user->id)
            ->where('service_type', 'cable')
            ->orderBy('is_favorite', 'desc')
            ->orderBy('name')
            ->get();

        return Inertia::render('User/Cable', [
            'cableProviders' => $cableProviders,
            'beneficiaries' => $beneficiaries,
        ]);
    }

    /**
     * Get cable plans for a specific provider.
     *
     * @param  \App\Models\CableProvider  $provider
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPlans(CableProvider $provider)
    {
        $plans = CablePlan::where('cable_provider_id', $provider->id)
            ->where('is_active', true)
            ->orderBy('selling_price')
            ->get();

        return response()->json($plans);
    }

    /**
     * Verify smart card number.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifySmartCard(Request $request)
    {
        $request->validate([
            'cable_provider_id' => 'required|exists:cable_providers,id',
            'smart_card_number' => 'required|string',
        ]);

        $provider = CableProvider::findOrFail($request->cable_provider_id);

        $verify = $this->wazobiaService->validateSmartcard($provider->code, $request->smart_card_number);

        if (!$verify['success']) {
            $verify = $this->vtpass->verifyCustomer($provider->code, $request->smart_card_number, 'smartcardno');
        }

        if (!$verify['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $verify['message'] ?? 'Unable to verify smart card',
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Smart card verified successfully',
            'data' => [
                'customer_name' => $verify['data']['Customer_Name'] ?? ($verify['data']['name'] ?? ''),
                'address' => $verify['data']['Address'] ?? '',
                'current_package' => $verify['data']['Current_Bouquet'] ?? '',
                'due_date' => $verify['data']['Due_Date'] ?? null,
            ],
        ]);
    }

    /**
     * Process cable subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'cable_provider_id' => 'required|exists:cable_providers,id',
            'cable_plan_id' => 'required|exists:cable_plans,id',
            'smart_card_number' => 'required|string',
            'customer_name' => 'required|string',
            'pin' => 'required|string|size:4',
            'save_as_beneficiary' => 'nullable|boolean',
            'beneficiary_name' => 'nullable|required_if:save_as_beneficiary,true|string|max:255',
            'beneficiary_id' => 'nullable|exists:beneficiaries,id',
        ]);

        $user = $request->user();

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $provider = CableProvider::findOrFail($request->cable_provider_id);
        $cablePlan = CablePlan::where('cable_provider_id', $provider->id)
            ->where('id', $request->cable_plan_id)
            ->firstOrFail();

        // Check if user has enough balance
        if ($user->wallet_balance < $cablePlan->selling_price) {
            return redirect()->back()->with('error', 'Insufficient wallet balance. Please fund your wallet.');
        }

        // Generate unique reference
        $reference = 'CABLE' . strtoupper(Str::random(8));

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'cable',
            'amount' => $cablePlan->selling_price,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $request->smart_card_number,
            'description' => $provider->name . ' ' . $cablePlan->name . ' Subscription for ' . $request->customer_name,
            'meta_data' => [
                'provider' => $provider->name,
                'provider_code' => $provider->code,
                'smart_card_number' => $request->smart_card_number,
                'customer_name' => $request->customer_name,
                'plan_name' => $cablePlan->name,
                'plan_code' => $cablePlan->code,
                'validity' => $cablePlan->validity,
                'amount_paid' => $cablePlan->selling_price,
            ],
        ]);

        // Deduct from user's wallet
        $user->wallet_balance -= $cablePlan->selling_price;
        $user->save();

        $productCode = $cablePlan->product_code ?? $cablePlan->code;

        $response = $this->wazobiaService->subscribeCableTV(
            $provider->code,
            $request->smart_card_number,
            'renew',
            1,
            $productCode,
            $user->phone_number
        );

        if (!$response['success']) {
            $params = [
                'request_id' => $reference,
                'serviceID' => $provider->code,
                'billersCode' => $request->smart_card_number,
                'variation_code' => $cablePlan->code,
                'amount' => (string) $cablePlan->selling_price,
                'phone' => $user->phone_number ?? '08000000000',
            ];
            $response = $this->vtpass->pay($params);
        }

        $vt = $response;

        if ($vt['success']) {
            // Update transaction status
            $transaction->status = 'successful';
            $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                'vtpass' => $vt['data'] ?? [],
            ]);
            $transaction->save();

            // Save as beneficiary if requested
            if ($request->save_as_beneficiary && !$request->beneficiary_id) {
                Beneficiary::create([
                    'user_id' => $user->id,
                    'name' => $request->beneficiary_name,
                    'smart_card_number' => $request->smart_card_number,
                    'service_type' => 'cable',
                    'cable_provider_id' => $provider->id,
                    'is_favorite' => false,
                    'meta_data' => [
                        'customer_name' => $request->customer_name,
                        'last_plan_id' => $cablePlan->id,
                        'last_plan_name' => $cablePlan->name,
                    ],
                ]);
            }

            return redirect()->route('dashboard')->with('success', 'Cable subscription successful!');
        } else {
            // If failed, refund the user
            $user->wallet_balance += $cablePlan->selling_price;
            $user->save();

            // Update transaction status
            $transaction->status = 'failed';
            $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                'vtpass_error' => $vt['message'] ?? 'Payment failed',
                'vtpass_raw' => $vt['raw'] ?? null,
            ]);
            $transaction->save();

            return redirect()->back()->with('error', $vt['message'] ?? 'Cable subscription failed. Please try again later.');
        }
    }

    protected function calculateProfitMargin($amount)
    {
        $user = Auth::user();
        $settings = Setting::first();

        // Apply pro user profit margin if user is pro
        if ($user->is_pro && $user->pro_expires_at > now()) {
            return $amount * ($settings->pro_cable_profit_percentage / 100);
        }

        // Otherwise use regular profit margin
        return parent::calculateProfitMargin($amount);
    }
}
