<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Borrowing;

class BorrowingConfirmation extends Notification implements ShouldQueue
{
    use Queueable;

    protected $borrowing;

    public function __construct(Borrowing $borrowing)
    {
        $this->borrowing = $borrowing;
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
        
        return (new MailMessage)
            ->subject("Your {$serviceName} Borrow Request Confirmed")
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line("Your {$serviceName} borrow request has been confirmed!")
            ->line('')
            ->line('Borrowing Details:')
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('Borrow ID: ' . $this->borrowing->id)
            ->line('Service: ' . $serviceName)
            ->line('Amount: ₦' . number_format($this->borrowing->amount, 2))
            ->line('Interest: ₦' . number_format($this->borrowing->interest_charged, 2))
            ->line('Total to Repay: ₦' . number_format($totalAmount, 2))
            ->line('Due Date: ' . $this->borrowing->due_date->format('M d, Y'))
            ->line('Days Remaining: ' . $this->borrowing->due_date->diffInDays(now()))
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('')
            ->line('Payment Method: ' . ($this->borrowing->auto_deduction_enabled ? 'Auto-deduction (Linked Card)' : 'Manual Payment'))
            ->line('')
            ->action('View Borrowing Details', url('/borrow/my-borrowings'))
            ->line('Remember: Auto-deduction will happen on or after your due date.')
            ->line('Thank you for using Paylow!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'amount' => $this->borrowing->amount,
            'interest' => $this->borrowing->interest_charged,
            'due_date' => $this->borrowing->due_date->toDateString(),
            'service_type' => $this->borrowing->type,
            'notification_type' => 'borrowing_confirmation',
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
