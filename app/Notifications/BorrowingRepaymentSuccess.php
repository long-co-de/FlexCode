<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Borrowing;
use App\Models\BorrowingRepayment;

class BorrowingRepaymentSuccess extends Notification implements ShouldQueue
{
    use Queueable;

    protected $borrowing;
    protected $repayment;

    public function __construct(Borrowing $borrowing, BorrowingRepayment $repayment)
    {
        $this->borrowing = $borrowing;
        $this->repayment = $repayment;
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
            ->subject('✅ Payment Successful - Borrowing Repaid')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line("Your {$serviceName} borrowing has been successfully repaid!")
            ->line('')
            ->line('Payment Details:')
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('Service: ' . $serviceName)
            ->line('Borrowing Reference: ' . $this->borrowing->reference)
            ->line('Repayment Reference: ' . $this->repayment->reference)
            ->line('Amount Paid: ₦' . number_format($this->repayment->amount, 2))
            ->line('Payment Method: ' . ucfirst($this->repayment->payment_method))
            ->line('Date Paid: ' . $this->repayment->created_at->format('M d, Y H:i'))
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('')
            ->line('Your borrowing debt has been cleared. Thank you for using our service!')
            ->action('View Transaction', url('/transactions/' . $this->repayment->id))
            ->line('')
            ->line('Keep using our service to build your credit history and access higher borrowing limits.')
            ->line('Thank you!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'repayment_id' => $this->repayment->id,
            'reference' => $this->borrowing->reference,
            'amount_paid' => $this->repayment->amount,
            'payment_date' => $this->repayment->created_at->toDateString(),
            'service_type' => $this->borrowing->type,
            'notification_type' => 'repayment_success',
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
