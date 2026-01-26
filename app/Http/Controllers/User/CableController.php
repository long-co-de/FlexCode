<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CableProvider;
use App\Models\CablePlan;
use App\Models\Transaction;
use App\Models\Beneficiary;
use App\Services\DatavendroService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Traits\ProProfitCalculator;

class CableController extends AtomicController
{
    use ProProfitCalculator;

    protected $datavendroService;

    public function __construct(DatavendroService $datavendroService)
    {
        $this->datavendroService = $datavendroService;
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
        return back()->with('info', 'this service is temporarily unavailable at the moment. We are working to restore it as soon as possible.');

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

        $verify = $this->datavendroService->validateIuc($request->smart_card_number, $provider->code);

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
                'customer_name' => $verify['data']['Customer_Name'] ?? ($verify['data']['name'] ?? ($verify['data']['customer_name'] ?? '')),
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
        return back()->with('info', 'this service is temporarily unavailable at the moment. We are working to restore it as soon as possible.');

        $request->validate([
            'cable_provider_id' => 'required|exists:cable_providers,id',
            'cable_plan_id' => 'required|exists:cable_plans,id',
            'smart_card_number' => 'required|string',
            'customer_name' => 'required|string',
            'pin' => 'required|string|size:4',
            'save_as_beneficiary' => 'nullable|boolean',
            'beneficiary_name' => 'nullable|required_if:save_as_beneficiary,true|string|max:255',
            'beneficiary_id' => 'nullable|exists:beneficiaries,id',
            'request_id' => 'nullable|string',
        ]);

        $user = $request->user();

        // **SECURITY FIX 1: Check for duplicate request**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'cable_purchase')) {
            return redirect()->back()->with('error', 'This request is already being processed. Please wait.');
        }

        // **SECURITY FIX 2: Rate limiting**
        if ($this->isRateLimited($user->id, 'cable_purchase')) {
            return redirect()->back()->with('error', 'Too many attempts. Please wait before trying again.');
        }

        // Verify PIN
        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $provider = CableProvider::findOrFail($request->cable_provider_id);
        $cablePlan = CablePlan::where('cable_provider_id', $provider->id)
            ->where('id', $request->cable_plan_id)
            ->firstOrFail();

        try {
            $result = $this->processAtomicTransaction($user->id, $cablePlan->selling_price, function ($lockedUser) use ($request, $provider, $cablePlan, $requestId) {

                $reference = 'CABLE' . strtoupper(Str::random(10)) . time();
                $profit = $this->calculateProfitMargin($cablePlan->selling_price);

                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'cable',
                    'amount' => $cablePlan->selling_price,
                    'fee' => 0,
                    'profit' => $profit,
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
                        'request_id' => $requestId,
                    ],
                ]);

                // Deduct from wallet
                $this->deductWallet($lockedUser, $cablePlan->selling_price, 'cable subscription');

                return $transaction;
            });

            $transaction = $result;

            $response = $this->datavendroService->subscribeCable(
                $request->smart_card_number,
                $provider->code,
                $cablePlan->code
            );

            if ($response['success']) {
                $transaction->status = 'successful';
                $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                    'api_response' => $response['data'] ?? [],
                    'completed_at' => now(),
                ]);
                $transaction->save();

                // Record system profit
                $this->recordSystemProfit($transaction, $transaction->profit, 'cable');

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
                // API failed, refund the user using atomic helper
                $this->failAndRefund($transaction, $user->id, $cablePlan->selling_price, $response);

                return redirect()->back()->with('error', $response['message'] ?? 'Cable subscription failed. Your money has been refunded.');
            }
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    protected function calculateProfitMargin($amount, $type = 'cable')
    {
        return $this->isProUser()
            ? $this->getProProfitMargin($amount, 'cable')
            : parent::calculateProfitMargin($amount, 'cable');
    }
}
