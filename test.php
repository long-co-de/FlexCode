<?php

$meterNumber = '45150406911';
$discoName = 'yola-electric';
$meterType = 'prepaid';
$apiToken = '8b0db02d232377ca7c7dd354e30b41a423f7201d';
$apiUrl = 'https://datavendor.ng/api/validatemeter';

// Construct URL with proper URL encoding
$url = sprintf(
    '%s?meternumber=%s&disconame=%s&mtype=%s',
    $apiUrl,
    urlencode($meterNumber),
    urlencode($discoName),
    urlencode($meterType)
);

echo "Sending request to Husmodata API...\n";
echo "URL: " . $url . "\n\n";

$curl = curl_init();

$headers = [
    'Authorization: Token ' . $apiToken,
    'Content-Type: application/json',
    'Accept: application/json',
    'User-Agent: PHP-CURL/1.0'
];

curl_setopt_array($curl, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'GET',
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_SSL_VERIFYPEER => true, // Always verify SSL in production
    CURLOPT_SSL_VERIFYHOST => 2,
    // CURLOPT_CAINFO => '/path/to/cacert.pem', // Uncomment and set path to CA certificates
]);

$response = curl_exec($curl);
$err = curl_error($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);

curl_close($curl);

// Handle errors
if ($err) {
    echo "cURL Error: " . $err . "\n";
    exit(1);
}

echo "HTTP Status Code: " . $httpCode . "\n";
echo "Content Type: " . ($contentType ?: 'Not specified') . "\n\n";

if ($response === false || empty($response)) {
    echo "Error: Received empty response from server\n";
    exit(1);
}

echo "Raw Response:\n" . $response . "\n\n";

// Check if response is JSON
$isJson = false;
if (strpos(strtolower($contentType), 'application/json') !== false || 
    json_decode($response) !== null) {
    
    $isJson = true;
    $decoded = json_decode($response, true);
    
    echo "Formatted JSON Response:\n";
    echo json_encode($decoded, JSON_PRETTY_PRINT) . "\n\n";
    
    // Check for API-specific error messages
    if (isset($decoded['status']) && $decoded['status'] !== 'success') {
        echo "API Error: " . ($decoded['message'] ?? 'Unknown error') . "\n";
    }
    
    // You can access specific fields like:
    // if (isset($decoded['customer_name'])) {
    //     echo "Customer Name: " . $decoded['customer_name'] . "\n";
    // }
    
} else {
    echo "Response is not JSON. Raw output above.\n";
}

// Log the request/response (optional)
$logEntry = sprintf(
    "[%s] URL: %s, HTTP Code: %d, Response: %s\n",
    date('Y-m-d H:i:s'),
    $url,
    $httpCode,
    substr($response, 0, 200) . (strlen($response) > 200 ? '...' : '')
);

// Uncomment to enable logging:
file_put_contents('api_log.txt', $logEntry, FILE_APPEND);

exit(0);