<?php

namespace App\Services;

use App\Models\Borrowing;
use App\Models\BorrowSetting;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Str;
use App\Notifications\BorrowingConfirmation;
use Illuminate\Support\Facades\Log;

class BorrowingService
{
    protected $husmodataService;

    protected $eligibilityService;

    public function __construct(
        PaymentService $paymentService,
        BorrowingEligibilityService $eligibilityService,
        DatavendroService $datavendroService,
        HusmodataService $husmodataService
    ) {
        $this->paymentService = $paymentService;
        $this->eligibilityService = $eligibilityService;
        $this->datavendroService = $datavendroService;
        $this->husmodataService = $husmodataService;
    }

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
        return $this->processBorrowing($user, 'electricity', $amount, [
            'meter' => $meter,
            'provider' => $provider,
            'amount' => $amount,
            'meter_type' => $meterType,
        ], $duration);
    }

    private function processBorrowing(User $user, $type, $amount, $details, $duration = 7)
    {
        // Check if user has an active linked card (SECURITY - REQUIRED FOR REPAYMENT)
        $activeCard = $user->cards()->where('is_active', true)->first();
        if (! $activeCard) {
            throw new \Exception('No active payment card linked to account. Please link a card to proceed with borrowing.');
        }

        // Recalculate eligibility with service-specific settings
        $eligibility = $this->eligibilityService->checkEligibility($user, $type);
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
            'status' => 'success',
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

        $this->husmodataService->buyData(
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

        $this->datavendroService->payElectricityBill(
            $meter,
            $provider,
            $amount,
            $meterType
        );
    }
}
