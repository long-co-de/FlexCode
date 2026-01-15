<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Borrowing;

class BorrowingRepaymentFailed extends Notification implements ShouldQueue
{
    use Queueable;

    protected $borrowing;
    protected $errorMessage;

    public function __construct(Borrowing $borrowing, string $errorMessage = '')
    {
        $this->borrowing = $borrowing;
        $this->errorMessage = $errorMessage;
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
            ->subject('⚠️ Payment Failed - Action Required')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line("We encountered an issue while attempting to collect your {$serviceName} borrowing repayment.")
            ->line('')
            ->line('Failed Payment Details:')
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('Service: ' . $serviceName)
            ->line('Reference: ' . $this->borrowing->reference)
            ->line('Amount Due: ₦' . number_format($this->borrowing->total_amount, 2))
            ->line('Due Date: ' . $this->borrowing->due_date->format('M d, Y'))
            ->line('Retry Attempts: ' . $this->borrowing->retry_count . '/3')
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('')
            ->line('Possible Reasons:')
            ->line('• Insufficient funds in your linked card')
            ->line('• Card has expired or been deactivated')
            ->line('• Payment gateway connectivity issues')
            ->line('')
            ->line('Please take action now to avoid penalties:')
            ->action('Make Manual Payment', url('/borrow/my-borrowings'))
            ->line('OR')
            ->line('Update Your Payment Card')
            ->action('Update Card', url('/cards'))
            ->line('')
            ->line('We will attempt automatic payment 2 more times before marking this as overdue.')
            ->line('For assistance, contact our support team.')
            ->line('Thank you!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'reference' => $this->borrowing->reference,
            'amount_due' => $this->borrowing->total_amount,
            'due_date' => $this->borrowing->due_date->toDateString(),
            'retry_count' => $this->borrowing->retry_count,
            'error_message' => $this->errorMessage,
            'service_type' => $this->borrowing->type,
            'notification_type' => 'repayment_failed',
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
