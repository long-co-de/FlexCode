<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaystackWebhookController extends Controller
{
    protected $paystackService;

    public function __construct(PaystackService $paystackService)
    {
        $this->paystackService = $paystackService;
    }

    /**
     * Handle Paystack webhook notification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function handle(Request $request)
    {
        // Only a POST with paystack signature header should be allowed
        if (!$request->isMethod('post') || !$request->header('x-paystack-signature')) {
            return response()->json(['message' => 'Invalid request'], 400);
        }

        $payload = $request->getContent();
        $signature = $request->header('x-paystack-signature');

        // Validate signature
        if (!$this->paystackService->validateWebhookSignature($payload, $signature)) {
            Log::warning('Paystack Webhook Error: Invalid signature', [
                'payload' => $payload,
                'signature' => $signature,
            ]);
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $data = json_decode($payload, true);

        // Process webhook event
        $result = $this->paystackService->processWebhook($data);

        if ($result['success']) {
            return response()->json(['message' => 'Webhook processed successfully'], 200);
        }

        return response()->json(['message' => $result['message'] ?? 'Webhook processing failed'], 400);
    }
}
