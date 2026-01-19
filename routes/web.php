<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\User\AirtimeController;
use App\Http\Controllers\User\DataController;
use App\Http\Controllers\User\CableController;
use App\Http\Controllers\User\CouponController;
use App\Http\Controllers\User\ElectricityController;
use App\Http\Controllers\User\WalletController;
use App\Http\Controllers\User\ReferralController;
use App\Http\Controllers\User\TransactionController;
use App\Http\Controllers\User\BeneficiaryController;
use App\Http\Controllers\WebhookController;
use App\Http\Middleware\CheckRole;
use App\Models\ContactForm;
use App\Models\Setting;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\User\BorrowingController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    $userAgent = strtolower(request()->userAgent() ?? '');
    $isMobile = \Illuminate\Support\Str::contains($userAgent, ['webview', 'android', 'iphone', 'ipad', 'ipod', 'mobile', 'wv']);

    if ($isMobile) {
        return Inertia::render('WebviewWelcome');
    }
    // return response()->json(array([$userAgentsComparisims,$requestuserAgent,'debug_value'=>$isMobile]));
    return Inertia::render('Welcome', [
        'auth' => [
            'user' => Auth::user(),
        ],
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

use App\Http\Controllers\AboutController;
use App\Http\Controllers\User\BorrowingAirtimeController;
use App\Http\Controllers\User\BorrowingDataController;
use App\Http\Controllers\User\BorrowingElectricityController;
use App\Http\Controllers\User\CardController;
use App\Models\Beneficiary;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\User\FeedbackController;
use App\Http\Controllers\User\PaymentRetrievalController;

// About and Contact pages
Route::get('/about', [AboutController::class, 'index'])->name('about');

Route::get('/contact', [App\Http\Controllers\ContactController::class, 'index'])->name('contact');
Route::post('/contact', [App\Http\Controllers\ContactController::class, 'submit'])->name('contact.submit');
Route::post('/contact/chat/send', [App\Http\Controllers\ContactController::class, 'sendChatMessage'])->name('contact.chat.send')->middleware(['auth']);

// Legal pages
Route::get('/privacy-policy', function () {
    return Inertia::render('PrivacyPolicy');
})->name('privacy-policy');

Route::get('/terms-of-service', function () {
    return Inertia::render('TermsOfService');
})->name('terms-of-service');
// Guest routes
Route::middleware('guest')->group(function () {
    // These routes are handled by Laravel Breeze
});

// Auth routes
Route::middleware(['auth', 'verified', \App\Http\Middleware\CheckActive::class])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/beneficiaries/list', function (Request $request) {
        $data = Beneficiary::where(['service_type' => 'bank_transfer', 'user_id' => $request->user()->id])->get(['name', 'phone_number']);
        return response()->json(['beneficiaries' => $data]);
    })->name('beneficiaries.index.api');
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/notifications', [ProfileController::class, 'updateNotifications'])->name('profile.notifications.update');
    Route::get('/account/delete', function () {
        return Inertia::render('DeleteAccount', [
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    })->name('account.delete');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // PIN routes
    Route::middleware([])->group(function () {
        Route::get('/pin/setup', [\App\Http\Controllers\PinController::class, 'showSetup'])->name('pin.setup.show');
        Route::post('/pin/setup', [\App\Http\Controllers\PinController::class, 'setup'])->name('pin.setup');
        Route::get('/pin/change', [\App\Http\Controllers\PinController::class, 'edit'])->name('pin.edit');
        Route::patch('/pin/update', [\App\Http\Controllers\PinController::class, 'update'])->name('pin.update');
        Route::get('/pin/reset', [\App\Http\Controllers\PinController::class, 'showReset'])->name('pin.reset.show');
        Route::post('/pin/reset-with-password', [\App\Http\Controllers\PinController::class, 'resetWithPassword'])->name('pin.reset-with-password');
        Route::post('/pin/verify', [\App\Http\Controllers\PinController::class, 'verify'])->name('pin.verify');
    });

    // User routes
    Route::middleware(['auth', 'verified'])->group(function () {
        // Pro Upgrade Routes
        Route::get('/upgrade/pro', [App\Http\Controllers\ProController::class, 'index'])->name('upgrade.pro');
        Route::post('/upgrade/pro', [App\Http\Controllers\ProController::class, 'upgrade'])->name('upgrade.pro.process');
        Route::get('/pro/banner-templates', [App\Http\Controllers\ProController::class, 'getProBannerTemplates'])->name('pro.banner-templates');

        // Notifications
        Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('/notifications/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::delete('/notifications/{id}', [App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('/notifications', [App\Http\Controllers\NotificationController::class, 'destroyAll'])->name('notifications.destroy-all');
        Route::get('/notifications/unread-count', [App\Http\Controllers\NotificationController::class, 'getUnreadCount'])->name('notifications.unread-count');
        Route::get('/notifications/latest-unread/{limit?}', [App\Http\Controllers\NotificationController::class, 'getLatestUnread'])->name('notifications.latest-unread');
        Route::post('/notifications/test', [App\Http\Controllers\NotificationController::class, 'sendTestNotification'])->name('notifications.test');

        // Routes that require PIN verification
        Route::middleware([])->group(function () {
            // Bills Payment Hub
            Route::get('/bills', function () {
                return Inertia::render('User/Bills');
            })->name('bills');

            // Airtime
            Route::get('/airtime', [AirtimeController::class, 'index'])->name('airtime');
            Route::post('/airtime/purchase', [AirtimeController::class, 'purchase'])
                ->middleware(\App\Http\Middleware\PreventRapidTransactions::class . ':airtime')
                ->name('airtime.purchase');

            // Data
            Route::get('/data', [DataController::class, 'index'])->name('data');
            Route::post('/data/purchase', [DataController::class, 'purchase'])
                ->middleware(\App\Http\Middleware\PreventRapidTransactions::class . ':data')
                ->name('data.purchase');
            Route::get('/data/plans/{network}', [DataController::class, 'getPlans'])->name('data.plans');

            // Cable TV
            Route::get('/cable', [CableController::class, 'index'])->name('cable');
            Route::post('/cable/purchase', [CableController::class, 'purchase'])->name('cable.purchase');
            Route::post('/cable/verify', [CableController::class, 'verifySmartCard'])->name('cable.verify');
            Route::get('/cable/plans/{provider}', [CableController::class, 'getPlans'])->name('cable.plans');

            // Electricity
            Route::get('/electricity', [ElectricityController::class, 'index'])->name('electricity');
            Route::post('/electricity/purchase', [ElectricityController::class, 'purchase'])->name('electricity.purchase');
            Route::post('/electricity/verify', [ElectricityController::class, 'verifyMeter'])->name('electricity.verify');

            // Wallet
            Route::get('/wallet', [WalletController::class, 'index'])->name('wallet');
            Route::post('/wallet/fund', [WalletController::class, 'fund'])->name('wallet.fund');
            Route::get('/wallet/verify', [WalletController::class, 'verifyPayment'])->name('wallet.verify');
            Route::get('/wallet/virtual-account', [WalletController::class, 'createVirtualAccount'])->name('wallet.virtual-account');
            Route::get('/wallet/transfer', [WalletController::class, 'showTransferPage'])->name('wallet.transfer.show');
            
            // **SECURITY: Apply rate limiting and atomic transaction protection to financial operations**
            Route::post('/wallet/transfer', [WalletController::class, 'transfer'])
                ->middleware(\App\Http\Middleware\PreventRapidTransactions::class . ':wallet')
                ->name('wallet.transfer');
            
            Route::post('/wallet/withdraw', [WalletController::class, 'withdraw'])
                ->middleware(\App\Http\Middleware\PreventRapidTransactions::class . ':wallet')
                ->name('wallet.withdraw');
                
            Route::get('/wallet/history', [WalletController::class, 'history'])->name('wallet.history');

            // Referral Program
            Route::get('/referral', [ReferralController::class, 'index'])->name('referral.index');
            Route::post('/referral/share-whatsapp', [ReferralController::class, 'shareWhatsapp'])->name('referral.share-whatsapp');
            Route::get('/referral/link', [ReferralController::class, 'getLink'])->name('referral.link');

            // Feedback
            Route::post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');
            Route::get('/feedback', [FeedbackController::class, 'index'])->name('feedback.index');
            Route::get('/feedback/{feedback}', [FeedbackController::class, 'show'])->name('feedback.show');

            // Payment Retrieval
            Route::get('/payment-retrieval', [PaymentRetrievalController::class, 'show'])->name('payment-retrieval.show');
            Route::post('/payment-retrieval/verify', [PaymentRetrievalController::class, 'retrieve'])->name('payment-retrieval.verify');

            // Coupons
            Route::post('/coupons/redeem', [CouponController::class, 'redeem'])->name('coupons.redeem');

            // Beneficiaries
            Route::get('/beneficiaries', [BeneficiaryController::class, 'index'])->name('beneficiaries.index');


            Route::post('/beneficiaries', [BeneficiaryController::class, 'store'])->name('beneficiaries.store');
            Route::put('/beneficiaries/{beneficiary}', [BeneficiaryController::class, 'update'])->name('beneficiaries.update');
            Route::post('/beneficiaries/{beneficiary}/toggle-favorite', [BeneficiaryController::class, 'toggleFavorite'])->name('beneficiaries.toggle-favorite');
            Route::delete('/beneficiaries/{beneficiary}', [BeneficiaryController::class, 'destroy'])->name('beneficiaries.destroy');

            // Transactions
            Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions');
            Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');
            Route::get('/transactions/{transaction}/receipt', [TransactionController::class, 'generateReceipt'])->name('transactions.receipt');
            Route::post('/transactions/{transaction}/share', [TransactionController::class, 'shareReceipt'])->name('transactions.share');
        });
    });

    // Agent routes
    Route::middleware(['auth', 'verified'])->prefix('agent')->name('agent.')->group(function () {
        // Apply agent middleware to all agent routes
        Route::middleware(['agent'])->group(function () {
            // Agent Dashboard
            Route::get('/dashboard', [App\Http\Controllers\Agent\DashboardController::class, 'index'])->name('dashboard');

            // Agent Transactions
            Route::get('/transactions', [App\Http\Controllers\Agent\TransactionController::class, 'index'])->name('transactions');
            Route::get('/transactions/{transaction}', [App\Http\Controllers\Agent\TransactionController::class, 'show'])->name('transactions.show');
            Route::post('/transactions/{transaction}', [App\Http\Controllers\Agent\TransactionController::class, 'update'])->name('transactions.update');

            // Agent Messages
            Route::get('/messages', [App\Http\Controllers\Agent\MessageController::class, 'index'])->name('messages');
            Route::get('/messages/conversation/{conversation}', [App\Http\Controllers\Agent\MessageController::class, 'showConversation'])->name('messages.conversation');
            Route::post('/messages/send', [App\Http\Controllers\Agent\MessageController::class, 'sendMessage'])->name('messages.send');
            Route::post('/messages/conversation/{conversation}/close', [App\Http\Controllers\Agent\MessageController::class, 'closeConversation'])->name('messages.close');

            // Agent Users Management
            Route::get('/users', [App\Http\Controllers\Agent\UserController::class, 'index'])->name('users');
            Route::get('/users/{user}', [App\Http\Controllers\Agent\UserController::class, 'show'])->name('users.show');
            Route::patch('/users/{user}/toggle-active', [App\Http\Controllers\Agent\UserController::class, 'toggleActive'])->name('users.toggle-active');

            // Agent Borrowings Management
            Route::get('/borrowings', [App\Http\Controllers\Agent\BorrowingController::class, 'index'])->name('borrowings.index');
            Route::get('/borrowings/{borrowing}', [App\Http\Controllers\Agent\BorrowingController::class, 'show'])->name('borrowings.show');
            Route::post('/borrowings/{borrowing}/approve', [App\Http\Controllers\Agent\BorrowingController::class, 'approve'])->name('borrowings.approve');
            Route::post('/borrowings/{borrowing}/reject', [App\Http\Controllers\Agent\BorrowingController::class, 'reject'])->name('borrowings.reject');
            Route::post('/borrowings/{borrowing}/mark-paid', [App\Http\Controllers\Agent\BorrowingController::class, 'markPaid'])->name('borrowings.mark-paid');

            // Agent Data Plans Management
            Route::get('/data-plans', [App\Http\Controllers\Agent\DataPlanController::class, 'index'])->name('data-plans');
            Route::post('/data-plans/{dataPlan}/toggle', [App\Http\Controllers\Agent\DataPlanController::class, 'toggle'])->name('data-plans.toggle');

            // Agent Wallet Fundings Management
            Route::get('/wallet-fundings', [App\Http\Controllers\Agent\WalletFundingController::class, 'index'])->name('wallet-fundings');
            Route::get('/wallet-fundings/{funding}', [App\Http\Controllers\Agent\WalletFundingController::class, 'show'])->name('wallet-fundings.show');
            Route::post('/wallet-fundings/{funding}/approve', [App\Http\Controllers\Agent\WalletFundingController::class, 'approve'])->name('wallet-fundings.approve');
            Route::post('/wallet-fundings/{funding}/reject', [App\Http\Controllers\Agent\WalletFundingController::class, 'reject'])->name('wallet-fundings.reject');

            // Agent Settings
            Route::get('/settings', [App\Http\Controllers\Agent\SettingsController::class, 'index'])->name('settings');
            Route::post('/settings', [App\Http\Controllers\Agent\SettingsController::class, 'update'])->name('settings.update');

            // Agent Notifications
            Route::get('/notifications', [App\Http\Controllers\Agent\NotificationController::class, 'index'])->name('notifications.index');
            Route::post('/notifications/send', [App\Http\Controllers\Agent\NotificationController::class, 'send'])->name('notifications.send');
        });
    });

    // Admin routes
    Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
        // Apply role middleware to all admin routes
        Route::middleware(['admin'])->group(function () {
            // Admin Dashboard
            Route::get('/dashboard', [DashboardController::class, 'adminDashboard'])->name('dashboard');

            // Admin Notifications
            Route::get('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'index'])->name('notifications.index');
            Route::get('/notifications/history', [\App\Http\Controllers\Admin\NotificationController::class, 'history'])->name('notifications.history');
            Route::post('/notifications/send', [\App\Http\Controllers\Admin\NotificationController::class, 'send'])->name('notifications.send');
            Route::get('/notifications/users', [\App\Http\Controllers\Admin\NotificationController::class, 'getUsers'])->name('notifications.getUsers');

            // Users Management
            Route::get('/users', [UserController::class, 'index'])->name('users');
            Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
            Route::post('/users', [UserController::class, 'store'])->name('users.store');
            Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
            Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::patch('/users/{user}/toggle-active', [UserController::class, 'toggleActive'])->name('users.toggle-active');
            Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
            Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

            // Transactions Management
            Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('transactions');
            Route::get('/transactions/{transaction}', [AdminTransactionController::class, 'show'])->name('transactions.show');
            Route::post('/transactions/{transaction}/update-status', [AdminTransactionController::class, 'updateStatus'])->name('transactions.update-status');

            // Feedback Management
            Route::get('/feedback', [\App\Http\Controllers\Admin\FeedbackController::class, 'index'])->name('feedback.index');
            Route::get('/feedback/{feedback}', [\App\Http\Controllers\Admin\FeedbackController::class, 'show'])->name('feedback.show');
            Route::patch('/feedback/{feedback}/status', [\App\Http\Controllers\Admin\FeedbackController::class, 'updateStatus'])->name('feedback.update-status');
            Route::post('/feedback/{feedback}/respond', [\App\Http\Controllers\Admin\FeedbackController::class, 'respond'])->name('feedback.respond');
            Route::get('/feedback/statistics', [\App\Http\Controllers\Admin\FeedbackController::class, 'statistics'])->name('feedback.statistics');

            // Coupons Management
            Route::get('/coupons', [\App\Http\Controllers\Admin\CouponController::class, 'index'])->name('coupons.index');
            Route::get('/coupons/create', [\App\Http\Controllers\Admin\CouponController::class, 'create'])->name('coupons.create');
            Route::post('/coupons', [\App\Http\Controllers\Admin\CouponController::class, 'store'])->name('coupons.store');
            Route::get('/coupons/{coupon}', [\App\Http\Controllers\Admin\CouponController::class, 'show'])->name('coupons.show');
            Route::delete('/coupons/{coupon}', [\App\Http\Controllers\Admin\CouponController::class, 'destroy'])->name('coupons.destroy');

            // Networks Management
            Route::get('/networks', [\App\Http\Controllers\Admin\NetworkController::class, 'index'])->name('networks');
            Route::get('/networks/create', [\App\Http\Controllers\Admin\NetworkController::class, 'create'])->name('networks.create');
            Route::post('/networks', [\App\Http\Controllers\Admin\NetworkController::class, 'store'])->name('networks.store');
            Route::get('/networks/{network}/edit', [\App\Http\Controllers\Admin\NetworkController::class, 'edit'])->name('networks.edit');
            Route::patch('/networks/{network}', [\App\Http\Controllers\Admin\NetworkController::class, 'update'])->name('networks.update');
            Route::delete('/networks/{network}', [\App\Http\Controllers\Admin\NetworkController::class, 'destroy'])->name('networks.destroy');

            // Data Plans Management
            Route::get('/data-plans', [\App\Http\Controllers\Admin\DataPlanController::class, 'index'])->name('data-plans');
            Route::get('/data-plans/create', [\App\Http\Controllers\Admin\DataPlanController::class, 'create'])->name('data-plans.create');
            Route::post('/data-plans', [\App\Http\Controllers\Admin\DataPlanController::class, 'store'])->name('data-plans.store');
            Route::get('/data-plans/{dataPlan}/edit', [\App\Http\Controllers\Admin\DataPlanController::class, 'edit'])->name('data-plans.edit');
            Route::patch('/data-plans/{dataPlan}', [\App\Http\Controllers\Admin\DataPlanController::class, 'update'])->name('data-plans.update');
            Route::delete('/data-plans/{dataPlan}', [\App\Http\Controllers\Admin\DataPlanController::class, 'destroy'])->name('data-plans.destroy');

            // Cable Providers Management
            Route::get('/cable-providers', [\App\Http\Controllers\Admin\CableProviderController::class, 'index'])->name('cable-providers');
            Route::get('/cable-providers/create', [\App\Http\Controllers\Admin\CableProviderController::class, 'create'])->name('cable-providers.create');
            Route::post('/cable-providers', [\App\Http\Controllers\Admin\CableProviderController::class, 'store'])->name('cable-providers.store');
            Route::get('/cable-providers/{cableProvider}/edit', [\App\Http\Controllers\Admin\CableProviderController::class, 'edit'])->name('cable-providers.edit');
            Route::patch('/cable-providers/{cableProvider}', [\App\Http\Controllers\Admin\CableProviderController::class, 'update'])->name('cable-providers.update');
            Route::delete('/cable-providers/{cableProvider}', [\App\Http\Controllers\Admin\CableProviderController::class, 'destroy'])->name('cable-providers.destroy');

            // Cable Plans Management
            Route::get('/cable-plans', [\App\Http\Controllers\Admin\CablePlanController::class, 'index'])->name('cable-plans');
            Route::get('/cable-plans/create', [\App\Http\Controllers\Admin\CablePlanController::class, 'create'])->name('cable-plans.create');
            Route::post('/cable-plans', [\App\Http\Controllers\Admin\CablePlanController::class, 'store'])->name('cable-plans.store');
            Route::get('/cable-plans/{cablePlan}/edit', [\App\Http\Controllers\Admin\CablePlanController::class, 'edit'])->name('cable-plans.edit');
            Route::patch('/cable-plans/{cablePlan}', [\App\Http\Controllers\Admin\CablePlanController::class, 'update'])->name('cable-plans.update');
            Route::delete('/cable-plans/{cablePlan}', [\App\Http\Controllers\Admin\CablePlanController::class, 'destroy'])->name('cable-plans.destroy');

            // Electricity Providers Management
            Route::get('/electricity-providers', [\App\Http\Controllers\Admin\ElectricityProviderController::class, 'index'])->name('electricity-providers');
            Route::get('/electricity-providers/create', [\App\Http\Controllers\Admin\ElectricityProviderController::class, 'create'])->name('electricity-providers.create');
            Route::post('/electricity-providers', [\App\Http\Controllers\Admin\ElectricityProviderController::class, 'store'])->name('electricity-providers.store');
            Route::get('/electricity-providers/{electricityProvider}/edit', [\App\Http\Controllers\Admin\ElectricityProviderController::class, 'edit'])->name('electricity-providers.edit');
            Route::patch('/electricity-providers/{electricityProvider}', [\App\Http\Controllers\Admin\ElectricityProviderController::class, 'update'])->name('electricity-providers.update');
            Route::delete('/electricity-providers/{electricityProvider}', [\App\Http\Controllers\Admin\ElectricityProviderController::class, 'destroy'])->name('electricity-providers.destroy');

            // Payment Methods Management
            Route::get('/payment-methods', [\App\Http\Controllers\Admin\PaymentMethodController::class, 'index'])->name('payment-methods');
            Route::get('/payment-methods/create', [\App\Http\Controllers\Admin\PaymentMethodController::class, 'create'])->name('payment-methods.create');
            Route::post('/payment-methods', [\App\Http\Controllers\Admin\PaymentMethodController::class, 'store'])->name('payment-methods.store');
            Route::get('/payment-methods/{paymentMethod}/edit', [\App\Http\Controllers\Admin\PaymentMethodController::class, 'edit'])->name('payment-methods.edit');
            Route::patch('/payment-methods/{paymentMethod}', [\App\Http\Controllers\Admin\PaymentMethodController::class, 'update'])->name('payment-methods.update');
            Route::delete('/payment-methods/{paymentMethod}', [\App\Http\Controllers\Admin\PaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');

            // Plan Type Profits Management
            Route::get('/plan-type-profits', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'index'])->name('plan-type-profits.index');
            Route::get('/plan-type-profits/create', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'create'])->name('plan-type-profits.create');
            Route::post('/plan-type-profits', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'store'])->name('plan-type-profits.store');
            Route::get('/plan-type-profits/{planTypeProfit}/edit', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'edit'])->name('plan-type-profits.edit');
            Route::patch('/plan-type-profits/{planTypeProfit}', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'update'])->name('plan-type-profits.update');
            Route::delete('/plan-type-profits/{planTypeProfit}', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'destroy'])->name('plan-type-profits.destroy');
            Route::post('/plan-type-profits/update-all-selling-prices', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'updateAllSellingPrices'])->name('plan-type-profits.update-all-selling-prices');
            Route::post('/plan-type-profits/fetch-from-api', [\App\Http\Controllers\Admin\PlanTypeProfitController::class, 'fetchFromApi'])->name('plan-type-profits.fetch-from-api');

            // Settings
            Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
            Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
            Route::get('/settings/test-api', [SettingsController::class, 'testApiConnection'])->name('settings.test-api');
            Route::get('/settings/test-xixapay', [SettingsController::class, 'testXixaPayConnection'])->name('settings.test-xixapay');

            // Provider Sync
            Route::get('/provider-sync', [\App\Http\Controllers\Admin\ProviderSyncController::class, 'index'])->name('provider-sync.index');
            Route::post('/provider-sync/sync', [\App\Http\Controllers\Admin\ProviderSyncController::class, 'sync'])->name('provider-sync.sync');
            Route::post('/provider-sync/test-connection', [\App\Http\Controllers\Admin\ProviderSyncController::class, 'testConnection'])->name('provider-sync.test-connection');

            // Wallet Funding Charges
            Route::get('/wallet-funding-charges', [\App\Http\Controllers\Admin\WalletFundingChargeController::class, 'index'])->name('wallet-funding-charges.index');
            Route::post('/wallet-funding-charges', [\App\Http\Controllers\Admin\WalletFundingChargeController::class, 'store'])->name('wallet-funding-charges.store');
            Route::put('/wallet-funding-charges/{walletFundingCharge}', [\App\Http\Controllers\Admin\WalletFundingChargeController::class, 'update'])->name('wallet-funding-charges.update');
            Route::delete('/wallet-funding-charges/{walletFundingCharge}', [\App\Http\Controllers\Admin\WalletFundingChargeController::class, 'destroy'])->name('wallet-funding-charges.destroy');

            // Wallet Fundings
            Route::get('/wallet-fundings', [\App\Http\Controllers\Admin\WalletFundingController::class, 'index'])->name('wallet-fundings');
            Route::get('/wallet-fundings/manual-funding', [\App\Http\Controllers\Admin\WalletFundingController::class, 'showManualFundingForm'])->name('wallet-fundings.manual-funding');
            Route::post('/wallet-fundings/manual-funding', [\App\Http\Controllers\Admin\WalletFundingController::class, 'manualFunding'])->name('wallet-fundings.manual-funding.store');
            Route::get('/wallet-fundings/payment-retrieval', [\App\Http\Controllers\Admin\WalletFundingController::class, 'showPaymentRetrievalForm'])->name('wallet-fundings.payment-retrieval');
            Route::post('/wallet-fundings/verify-payment', [\App\Http\Controllers\Admin\WalletFundingController::class, 'verifyAndRetrievePayment'])->name('wallet-fundings.verify-payment');

            // Borrow Settings Management
            Route::resource('borrow-settings', \App\Http\Controllers\Admin\BorrowSettingController::class)->names('borrow-settings');

            // Borrowings Management
            Route::prefix('borrowings')->name('borrowings.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\BorrowingController::class, 'index'])->name('index');
                Route::get('/{borrowing}', [\App\Http\Controllers\Admin\BorrowingController::class, 'show'])->name('show');
                Route::post('/{borrowing}/trigger-repayment', [\App\Http\Controllers\Admin\BorrowingController::class, 'triggerRepayment'])->name('trigger-repayment');
                Route::post('/{borrowing}/mark-as-paid', [\App\Http\Controllers\Admin\BorrowingController::class, 'markAsPaid'])->name('mark-as-paid');
<<<<<<< HEAD
                Route::post('/{borrowing}/process-payment', [\App\Http\Controllers\Admin\BorrowingController::class, 'processPayment'])->name('process-payment');
=======
>>>>>>> b91c65d43d1f7ef7d71cc968473e9664252c7d75
                Route::post('/{borrowing}/cancel', [\App\Http\Controllers\Admin\BorrowingController::class, 'cancel'])->name('cancel');
            });

            // Credit Eligibility Settings Management
            Route::resource('credit-eligibility-settings', \App\Http\Controllers\Admin\CreditEligibilitySettingController::class)->names('credit-eligibility-settings');

            // Cron Job Logs Management
            Route::get('/cron-logs', [\App\Http\Controllers\Admin\CronLogController::class, 'index'])->name('cron-logs.index');
            Route::get('/cron-logs/{cronLog}', [\App\Http\Controllers\Admin\CronLogController::class, 'show'])->name('cron-logs.show');
            Route::get('/cron-logs/command/{commandName}', [\App\Http\Controllers\Admin\CronLogController::class, 'command'])->name('cron-logs.command');
        });
    });
});

// Webhook routes (no CSRF protection)

// Add to routes/web.php or routes/api.php
Route::middleware(['auth', 'verified'])->group(function () {
    // Card management
    // File: routes/web.php (or routes/api.php depending on your setup)


    // Borrowing for different services
    Route::prefix('borrow')->group(function () {
        // Data
        Route::get('/data', [BorrowingDataController::class, 'index'])->name('borrow.data');
        Route::post('/data', [BorrowingDataController::class, 'borrow'])->name('borrow.data.process');
        Route::get('/data/success/{borrowing}', [BorrowingDataController::class, 'success'])->name('borrow.data.success');

        // Airtime
        Route::get('/airtime', [BorrowingAirtimeController::class, 'index'])->name('borrow.airtime');
        Route::post('/airtime', [BorrowingAirtimeController::class, 'borrow'])->name('borrow.airtime.process');
        Route::get('/airtime/success/{borrowing}', [BorrowingAirtimeController::class, 'success'])->name('borrow.airtime.success');

        // Electricity
        Route::get('/electricity', [BorrowingElectricityController::class, 'index'])->name('borrow.electricity');
        Route::post('/electricity/verify', [BorrowingElectricityController::class, 'verifyMeter'])->name('borrow.electricity.verify');
        Route::post('/electricity', [BorrowingElectricityController::class, 'borrow'])->name('borrow.electricity.process');
        Route::get('/electricity/success/{borrowing}', [BorrowingElectricityController::class, 'success'])->name('borrow.electricity.success');

        // Cable (you can add this similarly)

        // Borrowing management
        Route::get('/my-borrowings', [BorrowingController::class, 'myBorrowings'])->name('borrow.my-borrowings');
        Route::post('/{borrowing}/repay', [BorrowingController::class, 'repay'])->name('borrow.repay');
    });
});

// Authenticated user routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Card management routes
    Route::prefix('cards')->name('cards.')->group(function () {
        Route::get('/', [CardController::class, 'index'])->name('index');
        Route::post('/', [CardController::class, 'store'])->name('store');
        Route::post('/{card}/set-default', [CardController::class, 'setDefault'])->name('set-default');
        Route::delete('/{card}', [CardController::class, 'destroy'])->name('destroy');
        Route::delete('/{card}/expired', [CardController::class, 'deleteExpiredCard'])->name('delete-expired');
        Route::post('/{card}/verify', [CardController::class, 'verify'])->name('verify');
        Route::post('/test', [CardController::class, 'test'])->name('test');
        Route::post('/charge', [CardController::class, 'charge'])->name('charge');

        // Card linking for borrowing
        Route::get('/link', [\App\Http\Controllers\User\CardLinkingController::class, 'show'])->name('link');
        Route::post('/link-from-payment', [\App\Http\Controllers\User\CardLinkingController::class, 'linkFromPayment'])->name('link-from-payment')->withoutMiddleware([VerifyCsrfToken::class]);
        Route::get('/check-status', [\App\Http\Controllers\User\CardLinkingController::class, 'checkCardStatus'])->name('check-status');
    });

    // Borrowing eligibility check
    Route::get('/check-borrowing-eligibility', [BorrowingController::class, 'checkEligibility'])->name('borrowing.check-eligibility');
    Route::get('/borrowing-summary', [BorrowingController::class, 'summary'])->name('borrowing.summary');

    // Borrowing routes
    Route::prefix('borrow')->name('borrow.')->group(function () {
        Route::get('/', [BorrowingController::class, 'index'])->name('index');
        // Data borrowing
        Route::get('/data', [BorrowingDataController::class, 'index'])->name('data');
        Route::post('/data', [BorrowingDataController::class, 'borrow'])->name('data.process');
        Route::get('/data/success/{borrowing}', [BorrowingDataController::class, 'success'])->name('data.success');

        // Airtime borrowing
        Route::get('/airtime', [BorrowingAirtimeController::class, 'index'])->name('airtime');
        Route::post('/airtime', [BorrowingAirtimeController::class, 'borrow'])->name('airtime.process');
        Route::get('/airtime/success/{borrowing}', [BorrowingAirtimeController::class, 'success'])->name('airtime.success');

        // Electricity borrowing
        Route::get('/electricity', [BorrowingElectricityController::class, 'index'])->name('electricity');
        Route::post('/electricity/verify', [BorrowingElectricityController::class, 'verifyMeter'])->name('electricity.verify');
        Route::post('/electricity', [BorrowingElectricityController::class, 'borrow'])->name('electricity.process');
        Route::get('/electricity/success/{borrowing}', [BorrowingElectricityController::class, 'success'])->name('electricity.success');

        // Borrowing management
        Route::get('/my-borrowings', [BorrowingController::class, 'myBorrowings'])->name('my-borrowings');
        Route::post('/repay-all', [BorrowingController::class, 'repayAll'])->name('repay-all');
        Route::post('/{borrowing}/repay', [BorrowingController::class, 'repay'])->name('repay');
        Route::get('/{borrowing}/details', [BorrowingController::class, 'show'])->name('show');
    });
});

// API routes for React frontend
Route::middleware(['auth:sanctum'])->prefix('api')->group(function () {
    Route::get('/user/profile', function () {
        return response()->json(auth('sanctum')->user());
    });

    Route::prefix('cards')->group(function () {
        Route::get('/', [CardController::class, 'indexApi']);
        Route::post('/', [CardController::class, 'store']);
        Route::post('/{card}/set-default', [CardController::class, 'setDefault']);
        Route::delete('/{card}', [CardController::class, 'destroy']);
        Route::post('/verify', [CardController::class, 'verifyCard']);
        Route::post('/test', [CardController::class, 'testCard']);
    });

    Route::prefix('borrowing')->group(function () {
        Route::get('/check-eligibility', [BorrowingController::class, 'checkEligibility']);
        Route::get('/summary', [BorrowingController::class, 'summary']);
        Route::get('/my-borrowings', [BorrowingController::class, 'myBorrowingsApi']);
        Route::post('/{borrowing}/repay', [BorrowingController::class, 'repay']);
    });
});

// Borrowing eligibility check
Route::get('/check-borrowing-eligibility', [BorrowingController::class, 'checkEligibility'])->name('borrowing.check-eligibility');
// utility routes  for shared hosting
// migrate-routes
Route::get('/migrate', function () {
    Artisan::call('migrate');
    return 'Migration complete';
});

require __DIR__ . '/auth.php';
