<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;

class ReferralBonusEarned extends Notification implements ShouldQueue
{
    use Queueable;

    protected $referrerName;
    protected $bonusAmount;
    protected $referredUserName;
    protected $depositAmount;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $referrerName, float $bonusAmount, string $referredUserName, float $depositAmount)
    {
        $this->referrerName = $referrerName;
        $this->bonusAmount = $bonusAmount;
        $this->referredUserName = $referredUserName;
        $this->depositAmount = $depositAmount;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Send email only if user has email notifications enabled
        if ($notifiable->email_notifications) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $formattedBonus = '₦' . number_format($this->bonusAmount, 2);
        $formattedDeposit = '₦' . number_format($this->depositAmount, 2);

        return (new MailMessage)
            ->subject('🎉 Referral Bonus Earned - ' . $formattedBonus)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Congratulations! You just earned a referral bonus!')
            ->line('')
            ->line('📊 **Bonus Details:**')
            ->line('• Referred User: ' . $this->referredUserName)
            ->line('• Their Deposit: ' . $formattedDeposit)
            ->line('• Your 4% Commission: ' . $formattedBonus)
            ->line('')
            ->line('Your referral bonus has been automatically added to your wallet. You can view this transaction in your wallet history.')
            ->line('')
            ->action('View Referral Program', url('/referral'))
            ->line('')
            ->line('Keep sharing your referral code to earn more!')
            ->line('')
            ->line('Best regards,')
            ->line('The BorrowLite Team');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Referral Bonus Earned',
            'message' => "You earned {₦" . number_format($this->bonusAmount, 2) . "} (4% commission) from {$this->referredUserName}'s deposit.",
            'type' => 'success',
            'referred_user' => $this->referredUserName,
            'bonus_amount' => $this->bonusAmount,
            'deposit_amount' => $this->depositAmount,
        ];
    }
}
