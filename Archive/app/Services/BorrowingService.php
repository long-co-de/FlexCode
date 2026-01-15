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
    protected $paymentService;

    protected $airtimeService;

    protected $dataService;

    protected $vtpassService;

    protected $eligibilityService;

    protected $wazobiaService;

    public function __construct(
        PaymentService $paymentService,
        BorrowingEligibilityService $eligibilityService,
        WazobiaService $wazobiaService,
        ?HusmodataService $airtimeService = null
    ) {
        $this->paymentService = $paymentService;
        $this->eligibilityService = $eligibilityService;
        $this->wazobiaService = $wazobiaService;
        $this->airtimeService = $airtimeService;
    }

    public function borrowAirtime(User $user, $phone, $amount, $network)
    {
        return $this->processBorrowing($user, 'airtime', $amount, [
            'phone' => $phone,
            'network' => $network,
        ]);
    }

    public function borrowData(User $user, $phone, $planId, $amount)
    {
        return $this->processBorrowing($user, 'data', $amount, [
            'phone' => $phone,
            'plan_id' => $planId,
        ]);
    }

    public function borrowCable(User $user, $smartcard, $planId, $amount)
    {
        return $this->processBorrowing($user, 'cable', $amount, [
            'smartcard' => $smartcard,
            'plan_id' => $planId,
        ]);
    }

    public function borrowElectricity(User $user, $meter, $amount, $provider)
    {
        return $this->processBorrowing($user, 'electricity', $amount, [
            'meter' => $meter,
            'provider' => $provider,
        ]);
    }

    private function processBorrowing(User $user, $type, $amount, $details)
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
        $interestRate = $this->getInterestRate($user, $borrowSetting);
        $dueDays = $borrowSetting->due_days;
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

        if (! $phone || ! $network) {
            return;
        }

        $response = $this->wazobiaService->topupAirtime(
            strtolower($network),
            $phone,
            1000,
            'VTU'
        );

        if (! $response['success'] && $this->airtimeService) {
            $this->airtimeService->buyAirtime(
                $phone,
                $network,
                1000,
                'BOR' . Str::random(8),
                'VTU'
            );
        }
    }

    private function processDataDelivery($details)
    {
        $phone = $details['phone'] ?? null;
        $planId = $details['plan_id'] ?? null;

        if (! $phone || ! $planId) {
            return;
        }

        $response = $this->wazobiaService->subscribeData(
            'mtn',
            $planId,
            $phone
        );

        if (! $response['success'] && $this->airtimeService) {
            $this->airtimeService->buyData(
                $phone,
                'mtn',
                $planId,
                'BOR' . Str::random(8)
            );
        }
    }

    private function processCableDelivery($details)
    {
        // Cable subscription already processed during purchase
        // This is a placeholder for future integrations
    }

    private function processElectricityDelivery($details)
    {
        $meter = $details['meter'] ?? null;
        $amount = $details['amount'] ?? 5000;

        if (! $meter) {
            return;
        }

        $this->wazobiaService->payElectricityBill(
            $meter,
            $amount,
            'prepaid'
        );
    }
}
