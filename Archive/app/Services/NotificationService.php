<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\SystemNotification;
use App\Notifications\TransactionNotification;
use App\Notifications\AdminNotification;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

class NotificationService
{
    /**
     * Send a system notification to a user.
     *
     * @param  \App\Models\User  $user
     * @param  string  $title
     * @param  string  $message
     * @param  string  $type
     * @param  string|null  $action
     * @param  string|null  $actionUrl
     * @return void
     */
    public function sendSystemNotification(User $user, string $title, string $message, string $type = 'info', string $action = null, string $actionUrl = null)
    {
        $user->notify(new SystemNotification($title, $message, $type, $action, $actionUrl));
    }

    /**
     * Send a transaction notification to a user.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Transaction  $transaction
     * @param  string  $message
     * @param  string  $type
     * @return void
     */
    public function sendTransactionNotification(User $user, Transaction $transaction, string $message, string $type = 'info')
    {
        $user->notify(new TransactionNotification($transaction, $message, $type));
    }

    /**
     * Send a system notification to all users.
     *
     * @param  string  $title
     * @param  string  $message
     * @param  string  $type
     * @param  string|null  $action
     * @param  string|null  $actionUrl
     * @return void
     */
    public function sendSystemNotificationToAllUsers(string $title, string $message, string $type = 'info', string $action = null, string $actionUrl = null)
    {
        $users = User::all();
        $count = $users->count();

        foreach ($users as $user) {
            $user->notifyNow(new SystemNotification($title, $message, $type, $action, $actionUrl));
        }

        // Track this admin notification
        $this->trackAdminNotification($title, $message, $type, $action, $actionUrl, 'all', $count);
    }

    /**
     * Track an admin notification for history purposes.
     *
     * @param  string  $title
     * @param  string  $message
     * @param  string  $type
     * @param  string|null  $action
     * @param  string|null  $actionUrl
     * @param  string|null  $target
     * @param  int|null  $sentCount
     * @return void
     */
    protected function trackAdminNotification(string $title, string $message, string $type = 'info', string $action = null, string $actionUrl = null, string $target = null, int $sentCount = null)
    {
        $admin = Auth::user();

        if ($admin) {
            $admin->notifyNow(new AdminNotification(
                $title,
                $message,
                $type,
                $action,
                $actionUrl,
                $target,
                $sentCount,
                $admin->id
            ));
        }
    }

    /**
     * Send a system notification to users with a specific role.
     *
     * @param  string  $role
     * @param  string  $title
     * @param  string  $message
     * @param  string  $type
     * @param  string|null  $action
     * @param  string|null  $actionUrl
     * @return void
     */
    public function sendSystemNotificationToRole(string $role, string $title, string $message, string $type = 'info', string $action = null, string $actionUrl = null)
    {
        $users = User::where('role', $role)->get();
        $count = $users->count();

        foreach ($users as $user) {
            $user->notify(new SystemNotification($title, $message, $type, $action, $actionUrl));
        }

        // Track this admin notification
        $this->trackAdminNotification($title, $message, $type, $action, $actionUrl, 'role:' . $role, $count);
    }

    /**
     * Send a system notification to specific users.
     *
     * @param  array  $userIds
     * @param  string  $title
     * @param  string  $message
     * @param  string  $type
     * @param  string|null  $action
     * @param  string|null  $actionUrl
     * @return void
     */
    public function sendSystemNotificationToUsers(array $userIds, string $title, string $message, string $type = 'info', string $action = null, string $actionUrl = null)
    {
        $users = User::whereIn('id', $userIds)->get();
        $count = $users->count();

        foreach ($users as $user) {
            $user->notify(new SystemNotification($title, $message, $type, $action, $actionUrl));
        }

        // Track this admin notification
        $this->trackAdminNotification($title, $message, $type, $action, $actionUrl, 'selected_users', $count);
    }

    /**
     * Send a system notification to users based on bulk criteria.
     *
     * @param  string  $criteria
     * @param  mixed  $value
     * @param  string  $operator
     * @param  string  $title
     * @param  string  $message
     * @param  string  $type
     * @param  string|null  $action
     * @param  string|null  $actionUrl
     * @return void
     */
    public function sendSystemNotificationByBulkCriteria(string $criteria, $value = null, string $operator = 'equal', string $title, string $message, string $type = 'info', string $action = null, string $actionUrl = null)
    {
        $query = User::query();

        switch ($criteria) {
            case 'active':
                $query->whereNotNull('email_verified_at');
                $criteriaDesc = 'active_users';
                break;

            case 'inactive':
                $query->whereNull('email_verified_at');
                $criteriaDesc = 'inactive_users';
                break;

            case 'recent':
                $query->where('created_at', '>=', now()->subDays(30));
                $criteriaDesc = 'recent_users';
                break;

            case 'wallet_balance':
                if ($operator === 'greater') {
                    $query->where('wallet_balance', '>', $value);
                    $criteriaDesc = 'wallet_balance_greater_' . $value;
                } elseif ($operator === 'less') {
                    $query->where('wallet_balance', '<', $value);
                    $criteriaDesc = 'wallet_balance_less_' . $value;
                } else {
                    $query->where('wallet_balance', '=', $value);
                    $criteriaDesc = 'wallet_balance_equal_' . $value;
                }
                break;

            default:
                $criteriaDesc = 'custom_criteria';
        }

        $users = $query->get();
        $count = $users->count();

        foreach ($users as $user) {
            $user->notify(new SystemNotification($title, $message, $type, $action, $actionUrl));
        }

        // Track this admin notification
        $this->trackAdminNotification($title, $message, $type, $action, $actionUrl, 'bulk:' . $criteriaDesc, $count);
    }

    /**
     * Send a welcome notification to a new user.
     *
     * @param  \App\Models\User  $user
     * @return void
     */
    public function sendWelcomeNotification(User $user)
    {
        $this->sendSystemNotification(
            $user,
            'Welcome to ' . config('app.name'),
            'Thank you for joining our platform. We are excited to have you on board!',
            'success',
            'Explore Dashboard',
            '/dashboard'
        );
    }

    /**
     * Send a notification when a user's wallet is funded.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Transaction  $transaction
     * @return void
     */
    public function sendWalletFundedNotification(User $user, Transaction $transaction)
    {
        $message = 'Your wallet has been funded with ₦' . number_format($transaction->amount, 2);
        $this->sendTransactionNotification($user, $transaction, $message, 'success');
    }

    /**
     * Send a notification when a transaction status changes.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Transaction  $transaction
     * @return void
     */
    public function sendTransactionStatusNotification(User $user, Transaction $transaction)
    {
        $message = 'Your transaction with reference ' . $transaction->reference . ' has been ' . $transaction->status;
        $type = $transaction->status === 'completed' ? 'success' : ($transaction->status === 'failed' ? 'error' : 'info');

        $this->sendTransactionNotification($user, $transaction, $message, $type);
    }
}
