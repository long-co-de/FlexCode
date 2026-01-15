<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\MonnifyService;
use App\Services\PaystackService;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle Monnify webhook notifications.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function monnify(Request $request)
    {
        try {
            // Verify webhook signature
            $signature = $request->header('monnify-signature');
            // In a real implementation, you would verify the signature here
            
            $payload = $request->all();
            Log::info('Monnify Webhook Received', ['payload' => $payload]);
            
            $monnifyService = app(MonnifyService::class);
            $response = $monnifyService->processWebhook($payload);
            
            return response()->json([
                'status' => $response['success'] ? 'success' : 'error',
                'message' => $response['message'] ?? 'Webhook processed',
            ]);
        } catch (\Exception $e) {
            Log::error('Monnify Webhook Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while processing the webhook',
            ], 500);
        }
    }
    
    /**
     * Handle Paystack webhook notifications.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function paystack(Request $request)
    {
        try {
            // Verify webhook signature
            $signature = $request->header('x-paystack-signature');
            // In a real implementation, you would verify the signature here
            
            $payload = $request->all();
            Log::info('Paystack Webhook Received', ['payload' => $payload]);
            
            $paystackService = app(PaystackService::class);
            $response = $paystackService->processWebhook($payload);
            
            return response()->json([
                'status' => $response['success'] ? 'success' : 'error',
                'message' => $response['message'] ?? 'Webhook processed',
            ]);
        } catch (\Exception $e) {
            Log::error('Paystack Webhook Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while processing the webhook',
            ], 500);
        }
    }
}