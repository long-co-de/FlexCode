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
use App\Http\Controllers\Api\Mobile\V1\AuthController as MobileAuthController;
use App\Http\Controllers\Api\Mobile\V1\BeneficiaryController as MobileBeneficiaryController;
use App\Http\Controllers\Api\Mobile\V1\BootstrapController as MobileBootstrapController;
use App\Http\Controllers\Api\Mobile\V1\BorrowingController as MobileBorrowingController;
use App\Http\Controllers\Api\Mobile\V1\CardController as MobileCardController;
use App\Http\Controllers\Api\Mobile\V1\CatalogController as MobileCatalogController;
use App\Http\Controllers\Api\Mobile\V1\DeviceController as MobileDeviceController;
use App\Http\Controllers\Api\Mobile\V1\FeedbackController as MobileFeedbackController;
use App\Http\Controllers\Api\Mobile\V1\NotificationController as MobileNotificationController;
use App\Http\Controllers\Api\Mobile\V1\PaymentReturnController as MobilePaymentReturnController;
use App\Http\Controllers\Api\Mobile\V1\PinController as MobilePinController;
use App\Http\Controllers\Api\Mobile\V1\ProfileController as MobileProfileController;
use App\Http\Controllers\Api\Mobile\V1\PurchaseController as MobilePurchaseController;
use App\Http\Controllers\Api\Mobile\V1\ReferralController as MobileReferralController;
use App\Http\Controllers\Api\Mobile\V1\TransactionController as MobileTransactionController;
use App\Http\Controllers\Api\Mobile\V1\WalletController as MobileWalletController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

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
Route::prefix('mobile/v1')
    ->name('mobile.api.v1.')
    ->withoutMiddleware([EnsureFrontendRequestsAreStateful::class])
    ->group(function () {
    Route::post('/auth/register', [MobileAuthController::class, 'register']);
    Route::post('/auth/login', [MobileAuthController::class, 'login']);
    Route::post('/auth/forgot-password', [MobileAuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [MobileAuthController::class, 'resetPassword']);
    Route::get('/payments/return', MobilePaymentReturnController::class)->name('payments.return');
});

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

Route::middleware('auth:sanctum')
    ->prefix('mobile/v1')
    ->name('mobile.api.v1.')
    ->withoutMiddleware([EnsureFrontendRequestsAreStateful::class])
    ->group(function () {
    Route::post('/auth/logout', [MobileAuthController::class, 'logout']);

    Route::get('/bootstrap', MobileBootstrapController::class);

    Route::get('/profile', [MobileProfileController::class, 'show']);
    Route::put('/profile', [MobileProfileController::class, 'update']);
    Route::put('/profile/password', [MobileProfileController::class, 'updatePassword']);
    Route::patch('/profile/notifications', [MobileProfileController::class, 'updateNotifications']);

    Route::prefix('pin')->group(function () {
        Route::post('/setup', [MobilePinController::class, 'setup']);
        Route::post('/verify', [MobilePinController::class, 'verify']);
        Route::post('/change', [MobilePinController::class, 'change']);
        Route::post('/reset-with-password', [MobilePinController::class, 'resetWithPassword']);
    });

    Route::prefix('catalog')->group(function () {
        Route::get('/networks', [MobileCatalogController::class, 'networks']);
        Route::get('/data-plans/{network}', [MobileCatalogController::class, 'dataPlans']);
        Route::get('/cable-providers', [MobileCatalogController::class, 'cableProviders']);
        Route::get('/cable-plans/{provider}', [MobileCatalogController::class, 'cablePlans']);
        Route::get('/electricity-providers', [MobileCatalogController::class, 'electricityProviders']);
    });

    Route::prefix('wallet')->group(function () {
        Route::get('/balance', [MobileWalletController::class, 'balance']);
        Route::get('/summary', [MobileWalletController::class, 'summary']);
        Route::post('/funding/init', [MobileWalletController::class, 'initializeFunding']);
        Route::get('/funding/{reference}/status', [MobileWalletController::class, 'fundingStatus']);
        Route::post('/transfers/verify-recipient', [MobileWalletController::class, 'verifyRecipient']);
        Route::post('/transfers', [MobileWalletController::class, 'transfer']);
        Route::post('/withdrawals', [MobileWalletController::class, 'withdraw']);
        Route::get('/history', [MobileWalletController::class, 'history']);
    });

    Route::prefix('purchases')->group(function () {
        Route::post('/cable/verify', [MobilePurchaseController::class, 'verifyCable']);
        Route::post('/electricity/verify', [MobilePurchaseController::class, 'verifyElectricity']);
        Route::post('/airtime', [MobilePurchaseController::class, 'airtime']);
        Route::post('/data', [MobilePurchaseController::class, 'data']);
        Route::post('/cable', [MobilePurchaseController::class, 'cable']);
        Route::post('/electricity', [MobilePurchaseController::class, 'electricity']);
    });

    Route::get('/transactions', [MobileTransactionController::class, 'index']);
    Route::get('/transactions/{transaction}', [MobileTransactionController::class, 'show']);

    Route::prefix('cards')->group(function () {
        Route::get('/', [MobileCardController::class, 'index']);
        Route::post('/link/init', [MobileCardController::class, 'initializeLink']);
        Route::get('/link/{reference}/status', [MobileCardController::class, 'linkStatus']);
        Route::post('/link/reward', [MobileCardController::class, 'claimReward']);
        Route::post('/{card}/set-default', [MobileCardController::class, 'setDefault']);
        Route::delete('/{card}', [MobileCardController::class, 'destroy']);
    });

    Route::prefix('borrowing')->group(function () {
        Route::get('/eligibility', [MobileBorrowingController::class, 'eligibility']);
        Route::get('/summary', [MobileBorrowingController::class, 'summary']);
        Route::get('/', [MobileBorrowingController::class, 'index']);
        Route::get('/{borrowing}', [MobileBorrowingController::class, 'show']);
        Route::post('/airtime', [MobileBorrowingController::class, 'borrowAirtime']);
        Route::post('/data', [MobileBorrowingController::class, 'borrowData']);
        Route::post('/electricity', [MobileBorrowingController::class, 'borrowElectricity']);
        Route::post('/repay-all', [MobileBorrowingController::class, 'repayAll']);
        Route::post('/{borrowing}/repay', [MobileBorrowingController::class, 'repay']);
    });

    Route::prefix('beneficiaries')->group(function () {
        Route::get('/', [MobileBeneficiaryController::class, 'index']);
        Route::post('/', [MobileBeneficiaryController::class, 'store']);
        Route::put('/{beneficiary}', [MobileBeneficiaryController::class, 'update']);
        Route::post('/{beneficiary}/toggle-favorite', [MobileBeneficiaryController::class, 'toggleFavorite']);
        Route::delete('/{beneficiary}', [MobileBeneficiaryController::class, 'destroy']);
    });

    Route::prefix('notifications')->group(function () {
        Route::get('/', [MobileNotificationController::class, 'index']);
        Route::get('/unread-count', [MobileNotificationController::class, 'unreadCount']);
        Route::post('/read-all', [MobileNotificationController::class, 'markAllAsRead']);
        Route::post('/{id}/read', [MobileNotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [MobileNotificationController::class, 'destroy']);
        Route::delete('/', [MobileNotificationController::class, 'destroyAll']);
    });

    Route::get('/referrals', [MobileReferralController::class, 'index']);

    Route::prefix('feedback')->group(function () {
        Route::get('/', [MobileFeedbackController::class, 'index']);
        Route::post('/', [MobileFeedbackController::class, 'store']);
        Route::get('/{feedback}', [MobileFeedbackController::class, 'show']);
    });

    Route::prefix('devices')->group(function () {
        Route::get('/', [MobileDeviceController::class, 'index']);
        Route::post('/', [MobileDeviceController::class, 'store']);
        Route::delete('/{device}', [MobileDeviceController::class, 'destroy']);
    });
});
