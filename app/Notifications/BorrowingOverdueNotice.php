<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Borrowing;

class BorrowingOverdueNotice extends Notification implements ShouldQueue
{
    use Queueable;

    protected $borrowing;
    protected $daysOverdue;

    public function __construct(Borrowing $borrowing, int $daysOverdue = 0)
    {
        $this->borrowing = $borrowing;
        $this->daysOverdue = $daysOverdue;
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
        
        return (new MailMessage)
            ->subject('⚠️ URGENT: Your Borrowing Payment is Overdue')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line("Your {$serviceName} borrowing payment is now overdue!")
            ->line('')
            ->line('Overdue Details:')
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('Service: ' . $serviceName)
            ->line('Reference: ' . $this->borrowing->reference)
            ->line('Amount Due: ₦' . number_format($this->borrowing->total_amount, 2))
            ->line('Due Date: ' . $this->borrowing->due_date->format('M d, Y'))
            ->line('Days Overdue: ' . $this->daysOverdue)
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('')
            ->line('Please settle this debt immediately to avoid further penalties and account suspension.')
            ->action('Pay Now', url('/borrow/my-borrowings'))
            ->line('')
            ->line('If you have already made this payment, please disregard this notice.')
            ->line('For assistance, contact our support team immediately.')
            ->line('Thank you!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'reference' => $this->borrowing->reference,
            'amount' => $this->borrowing->total_amount,
            'due_date' => $this->borrowing->due_date->toDateString(),
            'days_overdue' => $this->daysOverdue,
            'service_type' => $this->borrowing->type,
            'notification_type' => 'overdue_notice',
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
