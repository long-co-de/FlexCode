<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Network;
use App\Models\DataPlan;
use App\Models\Transaction;
use App\Models\Beneficiary;
use App\Services\BorrowingEligibilityService;
use App\Services\WazobiaService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Notifications\PurchaseConfirmation;
use App\Models\Setting;

class DataController extends Controller
{
    protected $eligibilityService;
    protected $wazobiaService;

    public function __construct(BorrowingEligibilityService $eligibilityService, WazobiaService $wazobiaService)
    {
        $this->eligibilityService = $eligibilityService;
        $this->wazobiaService = $wazobiaService;
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
        ]);

        $user = $request->user();

        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $network = Network::findOrFail($request->network_id);
        $dataPlan = DataPlan::where('network_id', $network->id)
            ->where('id', $request->data_plan_id)
            ->firstOrFail();

        if ($user->wallet_balance < $dataPlan->selling_price) {
            return redirect()->back()->with('error', 'Insufficient wallet balance. Please fund your wallet.');
        }

        $reference = 'DATA' . strtoupper(Str::random(22));

        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'data',
            'amount' => $dataPlan->selling_price,
            'fee' => 0,
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
            ],
        ]);

        $user->wallet_balance -= $dataPlan->selling_price;
        $user->save();

        $networkId = $this->wazobiaService->getNetworkIdByCode($network->code);
        $planId = (int)($dataPlan->dataplan_id ?? $dataPlan->code);

        $response = $this->wazobiaService->subscribeData(
            $networkId,
            $planId,
            $request->phone_number,
            $request->boolean('ported_number', false)
        );

        if ($response['success']) {
            $metaData = $transaction->meta_data;
            $metaData['id'] = $response['data']['id'];
            $metaData['ident'] = $response['data']['ident'];
            $metaData['response'] = $response['data'];
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
            $user->wallet_balance += $dataPlan->selling_price;
            $user->save();

            $transaction->status = 'failed';
            $transaction->save();

            return redirect()->back()->with('error', 'Data purchase failed: ' . ($response['message'] ?? 'Unknown error'));
        }
    }

    protected function calculateProfitMargin($amount)
    {
        $user = Auth::user();
        $settings = Setting::first();

        if ($user->is_pro && $user->pro_expires_at > now()) {
            return $amount * ($settings->pro_data_profit_percentage / 100);
        }

        return parent::calculateProfitMargin($amount);
    }
}
