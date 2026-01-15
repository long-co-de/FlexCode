<?php
// File: CardController.php (Complete Version)
namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\UserCard;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CardController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Display user's saved cards (Web).
     */
    public function index()
    {
        $user = Auth::user();
        $cards = $user->cards()->orderBy('is_default', 'desc')->get();

        return Inertia::render('User/Cards/Index', [
            'cards' => $cards,
            'paystackPublicKey' => config('services.paystack.public_key') ?? Setting::where('key', 'paystack_public_key')->value('value'),
        ]);
    }

    /**
     * Display user's saved cards (API).
     */
    public function indexApi()
    {
        $user = Auth::user();
        $cards = $user->cards()->orderBy('is_default', 'desc')->get();

        return response()->json([
            'success' => true,
            'cards' => $cards,
        ]);
    }

    /**
     * Store a newly added card with verification.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'authorization_code' => 'required|string',
            'card_type' => 'required|string',
            'last4' => 'required|string|size:4',
            'exp_month' => 'required|string',
            'exp_year' => 'required|string',
            'bank' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        try {
            // Verify the card with Paystack
            $verification = $this->paymentService->verifyCardForTokenization(
                $request->authorization_code,
                $user
            );

            // Test the card with a small charge
            $testResult = $this->paymentService->testCard(
                $request->authorization_code,
                $user
            );

            if (!$testResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Card test failed: ' . $testResult['message']
                ], 400);
            }

            // Check if card already exists
            $existingCard = UserCard::where('authorization_code', $request->authorization_code)
                ->where('user_id', $user->id)
                ->first();

            if ($existingCard) {
                return response()->json([
                    'success' => false,
                    'message' => 'This card is already saved'
                ], 400);
            }

            // If this is the first card, set as default
            $isDefault = !$user->cards()->exists();

            // Save the card
            $card = UserCard::create([
                'user_id' => $user->id,
                'card_type' => $request->card_type,
                'last_four' => $request->last4,
                'authorization_code' => $request->authorization_code,
                'email' => $user->email,
                'bank' => $request->bank,
                'exp_month' => $request->exp_month,
                'exp_year' => $request->exp_year,
                'is_default' => $isDefault,
                'is_active' => true,
                'metadata' => [
                    'verification_data' => $verification,
                    'verified_at' => now()->toDateTimeString(),
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Card added and verified successfully',
                'card' => $card
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Set a card as default.
     */
    public function setDefault(UserCard $card)
    {
        $user = Auth::user();

        if ($card->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Remove default from all other cards
        UserCard::where('user_id', $user->id)
            ->where('id', '!=', $card->id)
            ->update(['is_default' => false]);

        // Set this card as default
        $card->is_default = true;
        $card->save();

        return response()->json([
            'success' => true,
            'message' => 'Card set as default'
        ]);
    }

    /**
     * Remove a saved card.
     */
    public function destroy(UserCard $card)
    {
        $user = Auth::user();

        if ($card->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($card->is_default && $user->cards()->count() > 1) {
            // Set another card as default before deleting
            $otherCard = $user->cards()
                ->where('id', '!=', $card->id)
                ->first();

            if ($otherCard) {
                $otherCard->is_default = true;
                $otherCard->save();
            }
        }

        $card->delete();

        return response()->json([
            'success' => true,
            'message' => 'Card removed successfully'
        ]);
    }

    /**
     * Verify a card (separate endpoint).
     */
    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'authorization_code' => 'required|string',
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        try {
            $verification = $this->paymentService->verifyCardForTokenization(
                $request->authorization_code,
                $user
            );

            return response()->json([
                'success' => true,
                'message' => 'Card verified successfully',
                'data' => $verification
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Test a card with small charge.
     */
    public function test(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'authorization_code' => 'required|string',
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        try {
            $testResult = $this->paymentService->testCard(
                $request->authorization_code,
                $user
            );

            return response()->json($testResult);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Charge a saved card.
     */
    public function charge(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'card_id' => 'required|exists:user_cards,id',
            'amount' => 'required|numeric|min:50',
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $card = UserCard::find($request->card_id);

        if (!$card || $card->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Card not found or unauthorized'
            ], 404);
        }

        try {
            $chargeResult = $this->paymentService->chargeCard(
                $card->authorization_code,
                $request->amount,
                $request->reason
            );

            return response()->json($chargeResult);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * API endpoint for card verification.
     */
    public function verifyCard(Request $request)
    {
        return $this->verify($request);
    }

    /**
     * API endpoint for card testing.
     */
    public function testCard(Request $request)
    {
        return $this->test($request);
    }

    /**
     * Delete a card - only allowed if card is expired or expiring soon
     */
    public function deleteExpiredCard(UserCard $card)
    {
        $user = Auth::user();

        if ($card->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Check if card is actually expired or expiring soon
        if (!$card->isExpired() && !$card->isExpiringsoon()) {
            return response()->json([
                'success' => false,
                'message' => 'Card is still valid. You can only delete expired or expiring cards.'
            ], 400);
        }

        try {
            // Mark card as expired
            $card->markAsExpired();

            // Increase user credit score
            $this->increaseScoreForExpiredCard($user, $card);

            // If it was the default card, set another as default
            if ($card->is_default && $user->cards()->where('id', '!=', $card->id)->exists()) {
                $otherCard = $user->cards()
                    ->where('id', '!=', $card->id)
                    ->first();

                if ($otherCard) {
                    $otherCard->is_default = true;
                    $otherCard->save();
                }
            }

            // Delete the card
            $card->delete();

            // Recalculate borrowing eligibility
            $this->recalculateEligibility($user);

            return response()->json([
                'success' => true,
                'message' => 'Card deleted successfully. Your credit score has been increased.',
                'credit_score_increase' => 5,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting card: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Increase user's credit score when card expires
     */
    protected function increaseScoreForExpiredCard($user, $card): void
    {
        try {
            $eligibility = $user->borrowingEligibility;

            if ($eligibility) {
                $newScore = min(100, $eligibility->credit_score + 5);
                $eligibility->update(['credit_score' => $newScore]);

                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit_score_adjustment',
                    'amount' => 5,
                    'reference' => 'CARD_EXPIRED_SCORE_' . \Illuminate\Support\Str::random(8),
                    'status' => 'success',
                    'description' => 'Credit score increased due to card expiration',
                    'metadata' => [
                        'card_last_four' => $card->last_four,
                        'reason' => 'card_expired',
                    ],
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error increasing credit score', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Recalculate borrowing eligibility
     */
    protected function recalculateEligibility($user): void
    {
        try {
            $eligibilityService = app(\App\Services\BorrowingEligibilityService::class);
            $eligibilityService->checkEligibility($user);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error recalculating eligibility', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
