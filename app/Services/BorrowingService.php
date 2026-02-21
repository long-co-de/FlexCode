<?php

namespace App\Services;

use App\Models\Borrowing;
use App\Models\BorrowingRepayment;
use App\Models\BorrowSetting;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Str;
use App\Notifications\BorrowingConfirmation;
use Illuminate\Support\Facades\Log;

class BorrowingService
{
    protected $eligibilityService;

    protected $paymentService;

    protected $datavendroService;


    public function __construct(
        PaymentService $paymentService,
        BorrowingEligibilityService $eligibilityService,
        DatavendroService $datavendroService
    ) {
        $this->paymentService = $paymentService;
        $this->eligibilityService = $eligibilityService;
        $this->datavendroService = $datavendroService;
    }

    /**
     * Settle outstanding debts from incoming funding
     * Returns the remaining amount
     */
    public function settleDebts(User $user, $amount)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($user, $amount) {
            $remainingAmount = $amount;

            // Lock the user to ensure we have the latest state
            $user = User::where('id', $user->id)->lockForUpdate()->first();

            // Lock borrowings to prevent concurrent settlements
            $activeBorrowings = $user->borrowings()
                ->whereIn('status', ['active', 'overdue'])
                ->orderBy('due_date', 'asc')
                ->lockForUpdate()
                ->get();

            foreach ($activeBorrowings as $borrowing) {
                if ($remainingAmount <= 0) {
                    break;
                }

                $amountToPay = $borrowing->total_amount;

                // If we have enough to pay the full debt
                if ($remainingAmount >= $amountToPay) {
                    $this->payDebt($borrowing, $amountToPay, 'wallet_funding');
                    $remainingAmount -= $amountToPay;
                }
            }

            return $remainingAmount;
        });
    }

    /**
     * Repay all borrowings using linked card (primary method)
     * Falls back to wallet if card payment fails
     */
    public function repayAllFromCard(User $user)
    {        $activeBorrowings = $user->borrowings()
            ->whereIn('status', ['active', 'overdue'])
            ->orderBy('due_date', 'asc')
            ->get();

        if ($activeBorrowings->isEmpty()) {
            throw new \Exception('No active borrowings found to repay.');
        }

        $totalAmount = $activeBorrowings->sum('total_amount');
        $defaultCard = $user->cards()->where('is_default', true)->first();

        // If user has a linked card, attempt to charge it
        if ($defaultCard && $defaultCard->authorization_code) {
            try {
                $chargeResponse = $this->paymentService->chargeAuthorization(
                    $defaultCard->authorization_code,
                    $totalAmount,
                    $user->email,
                    "Repayment for all outstanding borrowings"
                );

                if ($chargeResponse['success']) {
                    // Card charge successful - mark all borrowings as paid
                    $totalSettled = 0;
                    foreach ($activeBorrowings as $borrowing) {
                        $this->payDebt($borrowing, $borrowing->total_amount, 'card');
                        $totalSettled += $borrowing->total_amount;
                    }
                    return $totalSettled;
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Card repayment failed, falling back to wallet', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                // Fall through to wallet repayment
            }
        }

        // Fallback to wallet repayment
        return $this->repayFromWallet($user);
    }

    /**
     * Repay all possible debts from wallet balance
     */
    public function repayFromWallet(User $user)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
            // Lock user for update
            $user = User::where('id', $user->id)->lockForUpdate()->first();
            $walletBalance = $user->wallet_balance;

            if ($walletBalance <= 0) {
                throw new \Exception('Insufficient wallet balance to perform repayment.');
            }

            $activeBorrowings = $user->borrowings()
                ->whereIn('status', ['active', 'overdue'])
                ->orderBy('due_date', 'asc')
                ->get();

            if ($activeBorrowings->isEmpty()) {
                throw new \Exception('No active borrowings found to repay.');
            }

            $totalSettled = 0;
            foreach ($activeBorrowings as $borrowing) {
                $amountToPay = $borrowing->total_amount;

                if ($walletBalance >= $amountToPay) {
                    // Deduct from wallet
                    $user->wallet_balance -= $amountToPay;
                    $user->save();

                    // Process repayment
                    $this->payDebt($borrowing, $amountToPay, 'wallet');

                    $walletBalance -= $amountToPay;
                    $totalSettled += $amountToPay;
                } else {
                    // We don't support partial repayments yet based on schema
                    continue;
                }
            }

            if ($totalSettled === 0) {
                throw new \Exception('Wallet balance is insufficient to settle any of the active borrowings.');
            }

            return $totalSettled;
        });
    }

    public function payDebt(Borrowing $borrowing, $amount, $method)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($borrowing, $amount, $method) {
            // Lock the borrowing record
            $borrowing = Borrowing::where('id', $borrowing->id)->lockForUpdate()->firstOrFail();

            if ($borrowing->status === 'paid') {
                return $borrowing;
            }

            $user = $borrowing->user;
            // Lock the user and eligibility
            $user = User::where('id', $user->id)->lockForUpdate()->firstOrFail();

            $reference = 'BOR_REPAY_' . strtoupper(\Illuminate\Support\Str::random(10));

            // Create repayment record
            \App\Models\BorrowingRepayment::create([
                'borrowing_id' => $borrowing->id,
                'user_id' => $user->id,
                'reference' => $reference,
                'amount' => $amount,
                'payment_method' => $method,
                'status' => 'success',
                'metadata' => [
                    'description' => 'Debt settlement',
                    'settled_at' => now(),
                    'method' => $method,
                ],
            ]);

            // Update borrowing status
            $borrowing->status = 'paid';
            $borrowing->repaid_at = now();
            $borrowing->save();

            // Update eligibility
            $eligibility = $user->borrowingEligibility;
            if ($eligibility) {
                $eligibility = \App\Models\BorrowingEligibility::where('id', $eligibility->id)->lockForUpdate()->first();
                $eligibility->available_credit += $borrowing->amount;
                $eligibility->save();
            }

            // Create transaction record for the repayment
            $interestProfit = $borrowing->total_amount - $borrowing->amount;

            $transaction = \App\Models\Transaction::create([
                'user_id' => $user->id,
                'reference' => $reference,
                'type' => 'borrowing_repayment',
                'amount' => $amount,
                'profit' => $interestProfit,
                'status' => 'successful',
                'recipient' => 'System',
                'description' => "Debt settlement for {$borrowing->reference}",
                'meta_data' => [
                    'borrowing_id' => $borrowing->id,
                    'method' => $method,
                    'principal' => $borrowing->amount,
                    'interest' => $interestProfit,
                ],
            ]);

            // Record system profit
            if ($interestProfit > 0) {
                \App\Models\SystemProfit::create([
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'profit_source' => 'borrowing_interest',
                    'amount' => $amount,
                    'profit_percentage' => ($interestProfit / $borrowing->amount) * 100,
                    'profit_amount' => $interestProfit,
                    'status' => 'recorded',
                    'description' => "Interest profit from borrowing repayment: {$borrowing->reference}",
                    'meta_data' => [
                        'borrowing_id' => $borrowing->id,
                        'principal' => $borrowing->amount,
                        'interest' => $interestProfit,
                        'repayment_reference' => $reference,
                    ],
                ]);
            }

            \Illuminate\Support\Facades\Log::info('Debt settled', [
                'user_id' => $user->id,
                'borrowing_id' => $borrowing->id,
                'amount' => $amount,
                'method' => $method,
            ]);

            return $borrowing;
        });    }

    public function borrowAirtime(User $user, $phone, $amount, $network, $duration = 7)
    {
        return $this->processBorrowing($user, 'airtime', $amount, [
            'phone' => $phone,
            'network' => $network,
            'amount' => $amount,
        ], $duration);
    }

    public function borrowData(User $user, $phone, $planId, $amount, $network = 'mtn', $duration = 7)
    {
        return $this->processBorrowing($user, 'data', $amount, [
            'phone' => $phone,
            'plan_id' => $planId,
            'network' => $network,
            'amount' => $amount,
        ], $duration);
    }

    public function borrowCable(User $user, $smartcard, $planId, $amount, $cableName = '', $duration = 7)
    {
        return $this->processBorrowing($user, 'cable', $amount, [
            'smartcard' => $smartcard,
            'plan_id' => $planId,
            'cable_name' => $cableName,
            'amount' => $amount,
        ], $duration);
    }

    public function borrowElectricity(User $user, $meter, $amount, $provider, $meterType = 'prepaid', $duration = 7)
    {
        $vat = 100;
        $fee = 100;
        $totalBorrowAmount = $amount + $vat + $fee;

        return $this->processBorrowing($user, 'electricity', $totalBorrowAmount, [
            'meter' => $meter,
            'provider' => $provider,
            'amount' => $amount,
            'vat' => $vat,
            'fee' => $fee,
            'meter_type' => $meterType,
        ], $duration);
    }

    private function processBorrowing(User $user, $type, $amount, $details, $duration = 7)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($user, $type, $amount, $details, $duration) {
            // Check if user has an active linked card (SECURITY - REQUIRED FOR REPAYMENT)
            $activeCard = $user->cards()->where('is_active', true)->first();
            if (! $activeCard) {
                throw new \Exception('No active payment card linked to account. Please link a card to proceed with borrowing.');
            }

            // Recalculate eligibility with service-specific settings
            // Lock eligibility record for update
            $eligibility = $this->eligibilityService->checkEligibility($user, $type);
            $eligibility = \App\Models\BorrowingEligibility::where('id', $eligibility->id)->lockForUpdate()->first();

            if (! $eligibility || ! $eligibility->canBorrow($amount)) {
                throw new \Exception('Not eligible for borrowing or insufficient credit');
            }

            // Check borrow settings (min/max amounts)
            $borrowSetting = BorrowSetting::getByServiceType($type);
            if (! $borrowSetting || ! $borrowSetting->is_active) {
                throw new \Exception("Borrowing for {$type} is currently unavailable");
            }

            if (! $borrowSetting->isWithinLimit($amount)) {
                throw new \Exception(
                    "Borrow amount must be between ₦{$borrowSetting->min_amount} and ₦{$borrowSetting->max_amount}"
                );
            }

            // Create borrowing record
            // Handle custom interest rates based on duration (3 days: 10%, 7 days: 13%)
            if ($duration == 3) {
                $interestRate = 10;
                $dueDays = 3;
            } else {
                // Default to 7 days if not 3
                $interestRate = 13;
                $dueDays = 7;
            }

            $totalAmount = $amount + (($amount * $interestRate) / 100);
            $borrowing = Borrowing::create([
                'user_id' => $user->id,
                'reference' => 'BOR' . Str::random(10),
                'type' => $type,
                'amount' => $amount,
                'interest_rate' => $interestRate,
                'service_details' => json_encode($details),
                'transaction_details' => $details,
                'due_date' => now()->addDays($dueDays),
                'status' => 'active',
                'total_amount' => $totalAmount,
            ]);

            // Deduct from available credit
            $eligibility->available_credit -= $amount;
            $eligibility->save();

            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'reference' => $borrowing->reference,
                'type' => 'borrowing_' . $type,
                'amount' => $amount,
                'status' => 'successful',
                'recipient' => $details['phone'] ?? $details['meter'] ?? $details['smartcard'] ?? 'N/A',
                'description' => "Borrowed {$type} - {$amount}",
                'meta_data' => [
                    'borrowing_id' => $borrowing->id,
                    'due_date' => $borrowing->due_date,
                    'total_amount_due' => $borrowing->total_amount,
                ],
            ]);

            // Send borrowing confirmation email
            $user->notify(new BorrowingConfirmation($borrowing));

            // Process the actual service (airtime/data/cable/electricity)
            $this->processServiceDelivery($type, $details);

            return $borrowing;
        });
    }

    public function processRepayment(Borrowing $borrowing)
    {
        return $this->paymentService->processBorrowingRepayment($borrowing);
    }

    private function getInterestRate(User $user, BorrowSetting $setting)
    {
        if ($user->borrowingEligibility && $user->borrowingEligibility->credit_score >= 80) {
            return $setting->good_credit_interest_rate;
        }

        return $setting->base_interest_rate;
    }

    private function processServiceDelivery($type, $details)
    {
        try {
            switch ($type) {
                case 'airtime':
                    $this->processAirtimeDelivery($details);
                    break;
                case 'data':
                    $this->processDataDelivery($details);
                    break;
                case 'cable':
                    $this->processCableDelivery($details);
                    break;
                case 'electricity':
                    $this->processElectricityDelivery($details);
                    break;
            }
        } catch (\Exception $e) {
            Log::warning("Service delivery failed for {$type}: " . $e->getMessage());
        }
    }

    private function processAirtimeDelivery($details)
    {
        $phone = $details['phone'] ?? null;
        $network = $details['network'] ?? null;
        $amount = $details['amount'] ?? 100;

        if (!$phone || !$network) {
            return;
        }

        $this->datavendroService->buyAirtime(
            $phone,
            $network,
            $amount,
            'BOR' . Str::random(8)
        );
    }

    private function processDataDelivery($details)
    {
        $phone = $details['phone'] ?? null;
        $planId = $details['plan_id'] ?? null;
        $network = $details['network'] ?? 'mtn';

        if (!$phone || !$planId) {
            return;
        }

        $this->datavendroService->buyData(
            $phone,
            $network,
            $planId,
            'BOR' . Str::random(8),
            false
        );
    }

    private function processCableDelivery($details)
    {
        $smartcard = $details['smartcard'] ?? null;
        $planId = $details['plan_id'] ?? null;
        $cableName = $details['cable_name'] ?? null;

        if (!$smartcard || !$planId || !$cableName) {
            return;
        }

        $this->datavendroService->subscribeCable(
            $smartcard,
            $cableName,
            $planId
        );
    }

    private function processElectricityDelivery($details)
    {
        $meter = $details['meter'] ?? null;
        $amount = $details['amount'] ?? 500;
        $provider = $details['provider'] ?? null;
        $meterType = $details['meter_type'] ?? 'prepaid';

        if (!$meter || !$provider) {
            return;
        }

        $reference = $details['reference'] ?? 'BOR' . Str::random(10);
        $this->datavendroService->payElectricityBill(
            $meter,
            $provider,
            $amount,
            $meterType,
            $reference
        );
    }
    // In PaymentService.php, add this method:


}
