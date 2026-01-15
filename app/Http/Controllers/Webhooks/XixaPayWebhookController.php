<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\XixatPayService;
use Illuminate\Support\Facades\Log;

class XixaPayWebhookController extends Controller
{
    /**
     * Handle the incoming webhook request from XixaPay.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function handle(Request $request)
    {
        // Get the payload and signature
        $payload = $request->all();
        $signature = $request->header('xixapay');

        Log::info('XixaPay Webhook received', ['payload' => $payload]);

        // Process the webhook
        $xixatPayService = app(XixatPayService::class);
        $response = $xixatPayService->processWebhook($payload, $signature);

        if ($response['success']) {
            return response()->json(['status' => 'success', 'message' => $response['message']], 200);
        } else {
            Log::error('XixaPay Webhook Error', ['message' => $response['message']]);
            return response()->json(['status' => 'error', 'message' => $response['message']], 400);
        }
    }
}