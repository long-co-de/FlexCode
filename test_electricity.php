<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\DatavendroService;
use Illuminate\Support\Facades\Log;

// Mocking or using actual service
$service = new DatavendroService();

// Payload from developer
$payload = [
    "disco_name" => "3", // This maps to EKEDC (Eko Electric) in DatavendroService::getDiscoId or is passed directly
    "amount" => "500",
    "meter_number" => "0137200335768",
    "MeterType" => "Prepaid",
    "reference" => "TEST" . time(),
];

echo "Testing Electricity Bill Payment with Datavendro...\n";
echo "Payload: " . json_encode($payload, JSON_PRETTY_PRINT) . "\n";

$useFake = filter_var(env('DATAVENDRO_TEST_FAKE', 'false'), FILTER_VALIDATE_BOOLEAN);
if ($useFake) {
    // Use Http::fake to inspect the request without hitting the live API
    \Illuminate\Support\Facades\Http::fake([
        '*' => \Illuminate\Support\Facades\Http::response([
            'Status' => 'success',
            'api_response' => 'Transaction Successful',
            'data' => [
                'token' => '1234-5678-9012-3456',
                'units' => '50.5'
            ]
        ], 200)
    ]);
    echo "Http::fake enabled (DATAVENDRO_TEST_FAKE=true).\n";
} else {
    echo "Http::fake disabled (real API call).\n";
}

try {
    $result = $service->payElectricityBill(
        $payload['meter_number'],
        $payload['disco_name'],
        $payload['amount'],
        $payload['MeterType'],
        $payload['reference']
    );

    if ($useFake) {
        // Get the recorded request
        $recordedRequest = \Illuminate\Support\Facades\Http::recorded()[0][0];

        echo "\nOutgoing Request Details:\n";
        echo "URL: " . $recordedRequest->url() . "\n";
        echo "Method: " . $recordedRequest->method() . "\n";
        echo "Headers: " . json_encode($recordedRequest->headers(), JSON_PRETTY_PRINT) . "\n";
        echo "Body: " . json_encode($recordedRequest->data(), JSON_PRETTY_PRINT) . "\n";
    }
    
    echo "\nResult: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
