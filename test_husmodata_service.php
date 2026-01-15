<?php

require __DIR__ . '/vendor/autoload.php';

use App\Services\HusmodataService;
use Illuminate\Support\Facades\Log;

// Create a simple bootstrap for the test
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Create an instance of the HusmodataService
$husmodataService = new HusmodataService();

// Test getUserInfo method
echo "Testing getUserInfo method...\n";
$userInfo = $husmodataService->getUserInfo();

if ($userInfo['success']) {
    echo "User info retrieved successfully!\n";
    
    // Display user details
    if (isset($userInfo['user'])) {
        echo "User details:\n";
        echo "- Username: " . ($userInfo['user']['username'] ?? 'N/A') . "\n";
        echo "- Email: " . ($userInfo['user']['email'] ?? 'N/A') . "\n";
        echo "- Wallet Balance: " . ($userInfo['user']['wallet_balance'] ?? 'N/A') . "\n";
    }
    
    // Display notification
    if (isset($userInfo['notification'])) {
        echo "\nNotification: " . $userInfo['notification'] . "\n";
    }
    
    // Display data plan count
    if (isset($userInfo['data_plans'])) {
        echo "\nData Plans:\n";
        foreach ($userInfo['data_plans'] as $networkKey => $plans) {
            echo "- $networkKey: " . count($plans) . " plans\n";
        }
    }
} else {
    echo "Failed to retrieve user info: " . ($userInfo['message'] ?? 'Unknown error') . "\n";
}

echo "\nTest completed.\n";