<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use Illuminate\Http\Request;

class PaymentReturnController extends Controller
{
    public function __invoke(Request $request)
    {
        $redirectUrl = $request->query('redirect_url');

        if ($redirectUrl) {
            $separator = str_contains($redirectUrl, '?') ? '&' : '?';
            return redirect()->away($redirectUrl . $separator . http_build_query([
                'reference' => $request->query('reference'),
                'context' => $request->query('context'),
                'status' => $request->query('trxref') ? 'returned' : 'unknown',
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment provider returned successfully. Poll the status endpoint with the supplied reference.',
            'reference' => $request->query('reference'),
            'context' => $request->query('context'),
        ]);
    }
}
