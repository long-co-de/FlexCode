<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Network;
use App\Models\DataPlan;
use App\Models\Transaction;
use App\Models\Beneficiary;
use App\Services\BorrowingEligibilityService;
use App\Services\HusmodataService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Notifications\PurchaseConfirmation;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class DataController extends AtomicController
{
    protected $eligibilityService;
    protected $husmodataService;

    public function __construct(BorrowingEligibilityService $eligibilityService, HusmodataService $husmodataService)
    {
        $this->eligibilityService = $eligibilityService;
        $this->husmodataService = $husmodataService;
    }

    /**
     * Display the data purchase page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        
        $eligibility = $this->eligibilityService->checkEligibility($user, 'data');
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();
        
        $networks = Network::where('is_active', true)->with('dataplans')->get();

        $beneficiaries = Beneficiary::where('user_id', $user->id)
            ->where('service_type', 'data')
            ->with('network')
            ->orderBy('is_favorite', 'desc')
            ->orderBy('name')
            ->get();

        $eligibilityResponse = [
            'is_eligible' => $eligibility->isEligible(),
            'credit_limit' => $eligibility->credit_limit,
            'available_credit' => $eligibility->available_credit,
            'credit_score' => $eligibility->credit_score,
            'rejection_reason' => $eligibility->rejection_reason,
        ];

        if (!$eligibility->isEligible()) {
            if (!$hasActiveCard) {
                $eligibilityResponse['rejection_reason_type'] = 'no_card';
            } elseif ($eligibility->eligibility_criteria && isset($eligibility->eligibility_criteria['account_age_days'])) {
                $eligibilityResponse['rejection_reason_type'] = 'account_age';
            } else {
                $eligibilityResponse['rejection_reason_type'] = 'credit_score';
            }
        }

        return Inertia::render('User/Data', [
            'networks' => $networks,
            'beneficiaries' => $beneficiaries,
            'eligibility' => $eligibilityResponse,
            'hasActiveCard' => $hasActiveCard,
        ]);
    }

    /**
     * Get data plans for a specific network.
     *
     * @param  \App\Models\Network  $network
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPlans(Network $network)
    {
        $plans = DataPlan::where('network_id', $network->id)
            ->where('is_active', true)
            ->orderBy('selling_price')
            ->get();

        return response()->json($plans);
    }

    /**
     * Process data purchase.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'network_id' => 'required|exists:networks,id',
            'data_plan_id' => 'required|exists:data_plans,id',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'save_as_beneficiary' => 'nullable|boolean',
            'beneficiary_name' => 'nullable|required_if:save_as_beneficiary,true|string|max:255',
            'beneficiary_id' => 'nullable|exists:beneficiaries,id',
            'pin' => 'required|string|size:4',
            'ported_number' => 'boolean',
            'request_id' => 'nullable|string',
        ]);

        $user = $request->user();

        // **SECURITY FIX 1: Check for duplicate request**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'data_purchase')) {
            return redirect()->back()->with('error', 'This request is already being processed. Please wait.');
        }

        // **SECURITY FIX 2: Rate limiting**
        if ($this->isRateLimited($user->id, 'data_purchase')) {
            return redirect()->back()->with('error', 'Too many attempts. Please wait before trying again.');
        }

        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $network = Network::findOrFail($request->network_id);
        $dataPlan = DataPlan::where('network_id', $network->id)
            ->where('id', $request->data_plan_id)
            ->firstOrFail();

        try {
            $result = $this->processAtomicTransaction($user->id, $dataPlan->selling_price, function ($lockedUser) use ($request, $network, $dataPlan, $requestId) {
                
                if (!$dataPlan->dataplan_id) {
                    throw new \Exception('This data plan is currently unavailable. Please try another one.');
                }

                $reference = 'DATA' . strtoupper(Str::random(10)) . time();
                $profit = $this->calculateProfitMargin($dataPlan->selling_price);

                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'data',
                    'amount' => $dataPlan->selling_price,
                    'fee' => 0,
                    'profit' => $profit,
                    'status' => 'pending',
                    'recipient' => $request->phone_number,
                    'description' => $network->name . ' ' . $dataPlan->name . ' Purchase to ' . $request->phone_number,
                    'meta_data' => [
                        'network' => $network->name,
                        'network_code' => $network->code,
                        'phone_number' => $request->phone_number,
                        'plan_name' => $dataPlan->name,
                        'plan_code' => $dataPlan->code,
                        'plan_type' => $dataPlan->plan_type,
                        'dataplan_id' => $dataPlan->dataplan_id,
                        'data_amount' => $dataPlan->data_amount,
                        'validity' => $dataPlan->validity,
                        'amount_paid' => $dataPlan->selling_price,
                        'beneficiary_id' => $request->beneficiary_id,
                        'request_id' => $requestId,
                    ],
                ]);

                // Deduct from wallet
                $this->deductWallet($lockedUser, $dataPlan->selling_price, 'data purchase');

                return $transaction;
            });

            $transaction = $result;

            $response = $this->husmodataService->buyData(
                $request->phone_number,
                $network->code,
                $dataPlan->dataplan_id,
                $transaction->reference,
                $request->boolean('ported_number', false)
            );

            if ($response['success']) {
                $metaData = $transaction->meta_data;
                $metaData['api_id'] = $response['data']['id'] ?? ($response['data']['Status'] ?? null);
                $metaData['response'] = $response['data'];
                $metaData['completed_at'] = now();
                $transaction->meta_data = $metaData;
                $transaction->status = 'successful';
                $transaction->save();

                $user->notify(new PurchaseConfirmation($transaction, 'data'));

                if ($request->save_as_beneficiary && !$request->beneficiary_id) {
                    Beneficiary::create([
                        'user_id' => $user->id,
                        'name' => $request->beneficiary_name,
                        'phone_number' => $request->phone_number,
                        'service_type' => 'data',
                        'network_id' => $network->id,
                        'is_favorite' => false,
                        'meta_data' => [
                            'last_plan_id' => $dataPlan->id,
                            'last_plan_name' => $dataPlan->name,
                            'last_data_amount' => $dataPlan->data_amount,
                        ],
                    ]);
                }

                return redirect()->route('dashboard')->with('success', 'Data purchase successful!');
            } else {
                // API failed, refund the user using atomic helper
                $this->failAndRefund($transaction, $user->id, $dataPlan->selling_price, $response);

                return redirect()->back()->with('error', 'Data purchase failed: ' . ($response['message'] ?? 'Unknown error. Your money has been refunded.'));
            }

        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    protected function calculateProfitMargin($amount,$type = 'data')
    {
        $user = Auth::user();
        $settings = Setting::first();

        if ($user->is_pro && $user->pro_expires_at > now()) {
            return $amount * ($settings->pro_data_profit_percentage / 100);
        }

        return parent::calculateProfitMargin($amount, 'data');
    }
}
