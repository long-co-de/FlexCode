<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\BorrowingResource;
use App\Models\Borrowing;
use App\Models\BorrowSetting;
use App\Models\DataPlan;
use App\Models\ElectricityProvider;
use App\Models\Network;
use App\Services\BorrowingEligibilityService;
use App\Services\BorrowingService;
use Illuminate\Http\Request;

class BorrowingController extends Controller
{
    public function __construct(
        protected BorrowingService $borrowingService,
        protected BorrowingEligibilityService $eligibilityService
    ) {
    }

    public function eligibility(Request $request)
    {
        $user = $request->user();
        $eligibility = $this->eligibilityService->checkEligibility($user);

        return $this->success([
            'is_eligible' => $eligibility->isEligible(),
            'credit_limit' => (float) $eligibility->credit_limit,
            'available_credit' => (float) $eligibility->available_credit,
            'credit_score' => (int) $eligibility->credit_score,
            'has_card' => $user->cards()->exists(),
            'max_borrowable' => (float) $eligibility->available_credit,
            'rejection_reason' => $eligibility->rejection_reason,
        ], 'Borrowing eligibility fetched successfully.');
    }

    public function summary(Request $request)
    {
        $user = $request->user();

        return $this->success([
            'total_borrowed' => (float) $user->borrowings()->sum('amount'),
            'total_repaid' => (float) $user->borrowings()->where('status', 'paid')->sum('amount'),
            'active_borrowings' => $user->activeBorrowings()->count(),
            'overdue_borrowings' => $user->overdueBorrowings()->count(),
            'next_due_date' => $user->activeBorrowings()->min('due_date'),
            'total_due' => (float) $user->activeBorrowings()->sum('total_amount'),
        ], 'Borrowing summary fetched successfully.');
    }

    public function index(Request $request)
    {
        $borrowings = $request->user()->borrowings()
            ->with(['repayments' => fn ($query) => $query->latest()])
            ->latest()
            ->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($borrowings, BorrowingResource::collection($borrowings), 'Borrowings fetched successfully.');
    }

    public function show(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->user_id !== $request->user()->id) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED_BORROWING_ACCESS', 403);
        }

        $borrowing->load(['repayments' => fn ($query) => $query->latest()]);

        return $this->success(new BorrowingResource($borrowing), 'Borrowing fetched successfully.');
    }

    public function borrowAirtime(Request $request)
    {
        $borrowSetting = BorrowSetting::where('service_type', 'airtime')
            ->where('is_active', true)
            ->first();
        if (! $borrowSetting) {
            return $this->error('Airtime borrowing is currently unavailable.', 'BORROWING_UNAVAILABLE', 400);
        }

        $request->validate([
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'network_id' => 'required|exists:networks,id',
            'amount' => "required|numeric|min:{$borrowSetting->min_amount}|max:{$borrowSetting->max_amount}",
        ]);

        try {
            $network = Network::findOrFail($request->network_id);
            $borrowing = $this->borrowingService->borrowAirtime(
                $request->user(),
                $request->phone_number,
                $request->amount,
                $network->code,
                (int) $borrowSetting->due_days
            );

            return $this->success(new BorrowingResource($borrowing->load('repayments')), 'Airtime borrowing created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 'BORROWING_NOT_ELIGIBLE', 400);
        }
    }

    public function borrowData(Request $request)
    {
        $borrowSetting = BorrowSetting::where('service_type', 'data')
            ->where('is_active', true)
            ->first();
        if (! $borrowSetting) {
            return $this->error('Data borrowing is currently unavailable.', 'BORROWING_UNAVAILABLE', 400);
        }

        $request->validate([
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'plan_id' => 'required|exists:data_plans,id',
        ]);

        try {
            $plan = DataPlan::with('network')->findOrFail($request->plan_id);
            $planAmount = (float) $plan->selling_price;
            if ($planAmount < (float) $borrowSetting->min_amount) {
                return $this->error("Selected plan amount must be at least NGN {$borrowSetting->min_amount}.", 'INVALID_AMOUNT', 422);
            }
            if ((float) $borrowSetting->max_amount > 0 && $planAmount > (float) $borrowSetting->max_amount) {
                return $this->error("Selected plan amount must not exceed NGN {$borrowSetting->max_amount}.", 'INVALID_AMOUNT', 422);
            }
            $borrowing = $this->borrowingService->borrowData(
                $request->user(),
                $request->phone_number,
                $plan->dataplan_id ?? $plan->code,
                $plan->selling_price,
                $plan->network->code,
                (int) $borrowSetting->due_days
            );

            return $this->success(new BorrowingResource($borrowing->load('repayments')), 'Data borrowing created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 'BORROWING_NOT_ELIGIBLE', 400);
        }
    }

    public function borrowElectricity(Request $request)
    {
        $borrowSetting = BorrowSetting::where('service_type', 'electricity')
            ->where('is_active', true)
            ->first();
        if (! $borrowSetting) {
            return $this->error('Electricity borrowing is currently unavailable.', 'BORROWING_UNAVAILABLE', 400);
        }

        $request->validate([
            'meter_number' => 'required|string',
            'provider_id' => 'required|exists:electricity_providers,id',
            'amount' => "required|numeric|min:{$borrowSetting->min_amount}|max:{$borrowSetting->max_amount}",
            'meter_type' => 'required|in:prepaid,postpaid',
        ]);

        try {
            $provider = ElectricityProvider::findOrFail($request->provider_id);
            $borrowing = $this->borrowingService->borrowElectricity(
                $request->user(),
                $request->meter_number,
                $request->amount,
                $provider->code,
                $request->meter_type,
                (int) $borrowSetting->due_days
            );

            return $this->success(new BorrowingResource($borrowing->load('repayments')), 'Electricity borrowing created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 'BORROWING_NOT_ELIGIBLE', 400);
        }
    }

    public function repay(Request $request, Borrowing $borrowing)
    {
        $request->validate([
            'request_id' => 'nullable|string',
        ]);

        if ($borrowing->user_id !== $request->user()->id) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED_BORROWING_ACCESS', 403);
        }

        try {
            $result = $this->borrowingService->processRepayment($borrowing);
            return $this->success([
                'borrowing' => new BorrowingResource($borrowing->fresh()->load('repayments')),
                'result' => $result,
            ], 'Repayment successful.');
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 'BORROWING_REPAYMENT_FAILED', 400);
        }
    }

    public function repayAll(Request $request)
    {
        try {
            $settled = $this->borrowingService->repayAllFromCard($request->user());

            return $this->success([
                'total_settled' => (float) $settled,
            ], 'All eligible borrowings repaid successfully.');
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 'BORROWING_REPAYMENT_FAILED', 400);
        }
    }
}
