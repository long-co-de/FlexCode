<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Network;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Beneficiary;
use App\Services\BorrowingEligibilityService;
use App\Services\WazobiaService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Traits\ProProfitCalculator;
use App\Models\Setting;
use App\Notifications\PurchaseConfirmation;

class AirtimeController extends Controller
{
    use ProProfitCalculator;

    protected $eligibilityService;
    protected $wazobiaService;

    public function __construct(BorrowingEligibilityService $eligibilityService, WazobiaService $wazobiaService)
    {
        $this->eligibilityService = $eligibilityService;
        $this->wazobiaService = $wazobiaService;
    }

    /**
     * Display the airtime purchase page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();

        $eligibility = $this->eligibilityService->checkEligibility($user, 'airtime');
        $hasActiveCard = $user->cards()->where('is_active', true)->exists();

        $networks = Network::with(['airtimeDiscounts' => function($query) {
                $query->where('is_active', true);
            }])
            ->where('is_active', true)
            ->get();

        $beneficiaries = Beneficiary::where('user_id', $user->id)
            ->where('service_type', 'airtime')
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

        return Inertia::render('User/Airtime', [
            'networks' => $networks,
            'beneficiaries' => $beneficiaries,
            'eligibility' => $eligibilityResponse,
            'hasActiveCard' => $hasActiveCard,
        ]);
    }

    public function purchase(Request $request)
    {
        $request->validate([
            'network_id' => 'required|exists:networks,id',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'amount' => 'required|numeric|min:50|max:50000',
            'airtime_type' => 'required|string|in:VTU,AWOOF,SHARE,SELL',
            'save_as_beneficiary' => 'nullable|boolean',
            'beneficiary_name' => 'nullable|required_if:save_as_beneficiary,true|string|max:255',
            'beneficiary_id' => 'nullable|exists:beneficiaries,id',
            'pin' => 'required|string|size:4',
            'ported_number'=> 'nullable|boolean',
        ]);

        $user = $request->user();

        if (!Hash::check($request->pin, $user->pin)) {
            return redirect()->back()->withErrors(['pin' => 'Invalid PIN. Please try again.']);
        }

        $network = Network::with(['airtimeDiscounts' => function($query) {
            $query->where('is_active', true);
        }])->findOrFail($request->network_id);

        $discount = ($network->airtimeDiscounts && $network->airtimeDiscounts->count() > 0)
            ? $network->airtimeDiscounts->first()->discount_percentage
            : 0;
        $discountAmount = ($request->amount * $discount) / 100;
        $amountToPay = $request->amount - $discountAmount;

        if ($user->wallet_balance < $amountToPay) {
            return redirect()->back()->with('error', 'Insufficient wallet balance. Please fund your wallet.');
        }

        $reference = 'AIR' . strtoupper(Str::random(8));

        $transaction = Transaction::create([
            'user_id' => $user->id,
            'reference' => $reference,
            'type' => 'airtime',
            'amount' => $amountToPay,
            'fee' => 0,
            'status' => 'pending',
            'recipient' => $request->phone_number,
            'description' => $network->name . ' ' . $request->airtime_type . ' Airtime Purchase of ₦' . $request->amount . ' to ' . $request->phone_number,
            'meta_data' => [
                'network' => $network->name,
                'network_code' => $network->code,
                'phone_number' => $request->phone_number,
                'amount' => $request->amount,
                'discount' => $discount,
                'amount_paid' => $amountToPay,
                'airtime_type' => $request->airtime_type,
                'beneficiary_id' => $request->beneficiary_id,
            ],
        ]);

        $user->wallet_balance -= $amountToPay;
        $user->save();

        $networkId = $this->wazobiaService->getNetworkIdByCode($network->code);

        $response = $this->wazobiaService->topupAirtime(
            $networkId,
            $request->phone_number,
            $request->amount,
            $request->airtime_type,
            $request->ported_number ?? false
        );

        if ($response['success']) {
            $transaction->status = 'successful';
            $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                'response' => $response,
                'ident'=> $response['data']['ident'],
                'id'=> $response['data']['id'],
            ]);
            $transaction->save();

            $user->notify(new PurchaseConfirmation($transaction, 'airtime'));

            if ($request->save_as_beneficiary && !$request->beneficiary_id) {
                Beneficiary::create([
                    'user_id' => $user->id,
                    'name' => $request->beneficiary_name,
                    'phone_number' => $request->phone_number,
                    'service_type' => 'airtime',
                    'network_id' => $network->id,
                    'is_favorite' => false,
                    'meta_data' => [
                        'airtime_type' => $request->airtime_type,
                        'last_amount' => $request->amount,
                    ],
                ]);
            }

            return redirect()->route('dashboard')->with('success', $request->airtime_type . ' Airtime purchase successful!');
        } else {
            $user->wallet_balance += $amountToPay;
            $user->save();

            $transaction->status = 'failed';
            $transaction->save();

            return redirect()->back()->with('error', 'Airtime purchase failed: ' . ($response['message'] ?? 'Unknown error'));
        }
    }

    protected function calculateProfitMargin($amount)
    {
        return $this->isProUser()
            ? $this->getProProfitMargin($amount, 'airtime')
            : parent::calculateProfitMargin($amount);
    }
}
