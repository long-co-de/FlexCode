<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\AtomicController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Network;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Beneficiary;
use App\Services\BorrowingEligibilityService;
use App\Services\DatavendroService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Traits\ProProfitCalculator;
use App\Models\Setting;
use App\Notifications\PurchaseConfirmation;
use Illuminate\Support\Facades\DB;

class AirtimeController extends AtomicController
{
    use ProProfitCalculator;

    protected $eligibilityService;
    protected $datavendroService;

    public function __construct(BorrowingEligibilityService $eligibilityService, DatavendroService $datavendroService)
    {
        $this->eligibilityService = $eligibilityService;
        $this->datavendroService = $datavendroService;
    }

    /**
     * Display the airtime purchase page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth('web')->user();

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
            'request_id' => 'nullable|string',
        ]);

        $user = $request->user();

        // **SECURITY FIX 1: Check for duplicate request**
        $requestId = $request->request_id ?: $this->generateRequestId($user->id);
        if ($this->isDuplicateRequest($requestId, $user->id, 'airtime_purchase')) {
            return redirect()->back()->with('error', 'This request is already being processed. Please wait.');
        }

        // **SECURITY FIX 2: Rate limiting**
        if ($this->isRateLimited($user->id, 'airtime_purchase')) {
            return redirect()->back()->with('error', 'Too many attempts. Please wait before trying again.');
        }

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

        try {
            $result = $this->processAtomicTransaction($user->id, $amountToPay, function ($lockedUser) use ($request, $network, $amountToPay, $discount, $requestId) {
                
                $reference = 'AIR' . strtoupper(Str::random(10)) . time();
                $profit = $this->calculateProfitMargin($request->amount);

                $transaction = Transaction::create([
                    'user_id' => $lockedUser->id,
                    'reference' => $reference,
                    'type' => 'airtime',
                    'amount' => $amountToPay,
                    'fee' => 0,
                    'profit' => $profit,
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
                        'request_id' => $requestId,
                    ],
                ]);

                // Deduct from wallet
                $this->deductWallet($lockedUser, $amountToPay, 'airtime purchase');

                return $transaction;
            });

            $transaction = $result;

            $response = $this->datavendroService->buyAirtime(
                $request->phone_number,
                $network->code,
                $request->amount,
                $transaction->reference,
                $request->airtime_type,
                $request->ported_number ?? false
            );

            if ($response['success']) {
                $transaction->status = 'successful';
                $transaction->meta_data = array_merge($transaction->meta_data ?? [], [
                    'response' => $response,
                    'api_transaction_id' => $response['api_transaction_id']
                        ?? ($response['data']['id'] ?? ($response['data']['ident'] ?? null)),
                    'api_status' => $response['api_status'] ?? null,
                    'ident' => $response['data']['ident'] ?? null,
                    'id' => $response['data']['id'] ?? null,
                    'completed_at' => now(),
                ]);
                $transaction->save();

                // Record system profit
                $this->recordSystemProfit($transaction, $transaction->profit, 'airtime');

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
                // API failed, refund the user using atomic helper
                $this->failAndRefund($transaction, $user->id, $amountToPay, $response);

                return redirect()->back()->with('error', 'Airtime purchase failed: ' . ($response['message'] ?? 'Unknown error. Your money has been refunded.'));
            }

        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    protected function calculateProfitMargin($amount, $type = 'airtime')
    {
        return $this->isProUser()
            ? $this->getProProfitMargin($amount, 'airtime')
            : parent::calculateProfitMargin($amount, 'airtime');
    }
}
