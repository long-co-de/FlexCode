<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

$apiKey = env('DATAVENDRO_API_KEY') ?: (\App\Models\Setting::where('key', 'datavendro_api_key')->value('value') ?? null);
$apiUrl = env('DATAVENDRO_API_URL') ?: (\App\Models\Setting::where('key', 'datavendro_api_url')->value('value') ?? 'https://datavendor.ng/api/');
$apiUrl = rtrim($apiUrl, '/');

if (!$apiKey) {
    fwrite(STDERR, "Missing API key. Set DATAVENDRO_API_KEY or add datavendro_api_key in settings.\n");
    exit(1);
}

$payload = [
    'disco_name' => '2',
    'amount' => '5000',
    'meter_number' => '01325857801000000',
    'MeterType' => 'Prepaid',
    'request_id' => 'ELEC' . Str::upper(Str::random(8)) . time(),
];

if (!empty($argv[1])) {
    $payload['meter_number'] = $argv[1];
}
if (!empty($argv[2])) {
    $payload['amount'] = $argv[2];
}
if (!empty($argv[3])) {
    $payload['disco_name'] = $argv[3];
}

$client = Http::withHeaders([
    'Authorization' => 'Token ' . $apiKey,
    'Accept' => 'application/json',
    'Content-Type' => 'application/json',
])->withoutVerifying();

$response = $client->post($apiUrl . '/billpayment/', $payload);

echo "URL: {$apiUrl}/billpayment/\n";
echo "Status: {$response->status()}\n";
echo "Request: " . json_encode($payload, JSON_PRETTY_PRINT) . "\n";
echo "Response: " . $response->body() . "\n";
