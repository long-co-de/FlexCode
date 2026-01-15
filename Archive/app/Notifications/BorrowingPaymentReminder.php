<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Borrowing;

class BorrowingPaymentReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected $borrowing;
    protected $daysRemaining;

    public function __construct(Borrowing $borrowing, int $daysRemaining = 0)
    {
        $this->borrowing = $borrowing;
        $this->daysRemaining = $daysRemaining;
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($notifiable->email_notifications) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $serviceName = $this->getServiceName($this->borrowing->type);
        $totalAmount = $this->borrowing->amount + $this->borrowing->interest_charged;
        
        $urgency = $this->daysRemaining <= 1 ? '⚠️ URGENT' : '📌 REMINDER';
        
        return (new MailMessage)
            ->subject("{$urgency}: Your {$serviceName} Payment is Due Soon")
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line("This is a reminder that your {$serviceName} borrow payment is due soon.")
            ->line('')
            ->line('Payment Details:')
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('Borrow ID: ' . $this->borrowing->id)
            ->line('Service: ' . $serviceName)
            ->line('Amount Borrowed: ₦' . number_format($this->borrowing->amount, 2))
            ->line('Interest: ₦' . number_format($this->borrowing->interest_charged, 2))
            ->line('Total Amount Due: ₦' . number_format($totalAmount, 2))
            ->line('Due Date: ' . $this->borrowing->due_date->format('M d, Y'))
            ->line('Days Remaining: ' . $this->daysRemaining)
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('')
            ->line('Payment Status: ' . ($this->borrowing->auto_deduction_enabled ? 'Auto-deduction enabled' : 'Manual payment required'))
            ->line('')
            ->action('Make Payment Now', url('/borrow/my-borrowings'))
            ->line('If payment is not made by the due date, your account may be suspended.')
            ->line('For assistance, contact our support team.')
            ->line('Thank you!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'amount' => $this->borrowing->amount,
            'interest' => $this->borrowing->interest_charged,
            'due_date' => $this->borrowing->due_date->toDateString(),
            'days_remaining' => $this->daysRemaining,
            'service_type' => $this->borrowing->type,
            'notification_type' => 'payment_reminder',
        ];
    }

    private function getServiceName(string $type): string
    {
        return match($type) {
            'airtime' => 'Airtime',
            'data' => 'Data',
            'electricity' => 'Electricity',
            'cable' => 'Cable TV',
            default => 'Service'
        };
    }
}
