<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://datavendor.ng/api/network/',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_HTTPHEADER => array(
    'Authorization: Token 8b0db02d232377ca7c7dd354e30b41a423f7201d',
    'Content-Type: application/json'
  ),
  CURLOPT_SSL_VERIFYPEER => false, // For testing only - disable SSL verification
));

echo "Sending request to Husmodata API...\n";

$response = curl_exec($curl);
$err = curl_error($curl);
$info = curl_getinfo($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error: " . $err . "\n";
} else {
  echo "HTTP Status Code: " . $info['http_code'] . "\n\n";
  echo "Response:\n" . $response . "\n";
  
  // Pretty print if it's JSON
  if (json_decode($response) !== null) {
    echo "\nFormatted JSON Response:\n";
    echo json_encode(json_decode($response), JSON_PRETTY_PRINT);
    echo "\n";
  }
}