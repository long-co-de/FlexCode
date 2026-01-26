<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AirtimeController;
use App\Http\Controllers\Api\DataController;
use App\Http\Controllers\Api\CableController;
use App\Http\Controllers\Api\ElectricityController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

Route::withoutMiddleware(VerifyCsrfToken::class)->group(function () {
    Route::post('/webhooks/xixapay', [\App\Http\Controllers\Webhooks\XixaPayWebhookController::class, 'handle'])->name('webhooks.xixapay');
    Route::post('/webhooks/paystack', [\App\Http\Controllers\Webhooks\PaystackWebhookController::class, 'handle'])->name('webhooks.paystack');
});

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/verify-user', [UserController::class, 'verifyUser'])->name('api.verify-user');

// Protected routes with token authentication
Route::middleware('auth:sanctum')->group(function () {
    // User profile
    Route::get('/user', [UserController::class, 'profile']);
    Route::put('/user', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);

    // API Key Management
    Route::post('/user/api-key/generate', [UserController::class, 'generateApiKey']);
    Route::delete('/user/api-key', [UserController::class, 'revokeApiKey']);
    Route::put('/user/api-key/toggle', [UserController::class, 'toggleApiKeyStatus']);

    // PIN Management
    Route::post('/pin/setup', [\App\Http\Controllers\Api\PinController::class, 'setup']);
    Route::post('/pin/verify', [\App\Http\Controllers\Api\PinController::class, 'verify']);
    Route::post('/pin/change', [\App\Http\Controllers\Api\PinController::class, 'change']);
    Route::post('/pin/reset-with-password', [\App\Http\Controllers\Api\PinController::class, 'resetWithPassword']);

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Services
    Route::prefix('services')->group(function () {
        // Airtime
        Route::get('/networks', [AirtimeController::class, 'getNetworks']);

        // Data
        Route::get('/data-plans/{network}', [DataController::class, 'getPlans']);

        // Cable TV
        Route::get('/cable-providers', [CableController::class, 'getProviders']);
        Route::get('/cable-plans/{provider}', [CableController::class, 'getPlans']);
        Route::post('/cable/verify', [CableController::class, 'verifySmartCard']);

        // Electricity
        Route::get('/electricity-providers', [ElectricityController::class, 'getProviders']);
        Route::post('/electricity/verify', [ElectricityController::class, 'verifyMeter']);

        // Routes that require PIN verification
        Route::middleware('pin.api_verify')->group(function () {
            // Airtime purchase
            Route::post('/airtime/purchase', [AirtimeController::class, 'purchase']);

            // Data purchase
            Route::post('/data/purchase', [DataController::class, 'purchase']);

            // Cable purchase
            Route::post('/cable/purchase', [CableController::class, 'purchase']);

            // Electricity purchase
            Route::post('/electricity/purchase', [ElectricityController::class, 'purchase']);
        });
    });

    // Wallet
    Route::prefix('wallet')->group(function () {
        Route::get('/', [WalletController::class, 'balance']);
        Route::get('/history', [WalletController::class, 'history']);

        // Routes that require PIN verification
        Route::middleware('pin.api_verify')->group(function () {
            Route::post('/fund', [WalletController::class, 'fund']);
            Route::post('/transfer', [WalletController::class, 'transfer']);
            Route::post('/withdraw', [WalletController::class, 'withdraw']);
        });
    });

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
});

// Protected routes with API key authentication
Route::middleware('auth.api_key')->prefix('v1')->group(function () {
    // Services
    Route::prefix('services')->group(function () {
        // Airtime
        Route::get('/networks', [AirtimeController::class, 'getNetworks']);

        // Data
        Route::get('/data-plans/{network}', [DataController::class, 'getPlans']);

        // Cable TV
        Route::get('/cable-providers', [CableController::class, 'getProviders']);
        Route::get('/cable-plans/{provider}', [CableController::class, 'getPlans']);
        Route::post('/cable/verify', [CableController::class, 'verifySmartCard']);

        // Electricity
        Route::get('/electricity-providers', [ElectricityController::class, 'getProviders']);
        Route::post('/electricity/verify', [ElectricityController::class, 'verifyMeter']);

        // Routes that require PIN verification
        Route::middleware('pin.api_verify')->group(function () {
            // Airtime purchase
            Route::post('/airtime/purchase', [AirtimeController::class, 'purchase']);

            // Data purchase
            Route::post('/data/purchase', [DataController::class, 'purchase']);

            // Cable purchase
            Route::post('/cable/purchase', [CableController::class, 'purchase']);

            // Electricity purchase
            Route::post('/electricity/purchase', [ElectricityController::class, 'purchase']);
        });
    });

    // Wallet
    Route::prefix('wallet')->group(function () {
        Route::get('/', [WalletController::class, 'balance']);
        Route::get('/history', [WalletController::class, 'history']);
    });

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
});
