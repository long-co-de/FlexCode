<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Transaction;

class PurchaseConfirmation extends Notification implements ShouldQueue
{
    use Queueable;

    protected $transaction;
    protected $serviceType;

    public function __construct(Transaction $transaction, string $serviceType)
    {
        $this->transaction = $transaction;
        $this->serviceType = $serviceType;
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
        $serviceName = $this->getServiceName($this->serviceType);
        $meta = $this->transaction->meta_data;
        
        $message = (new MailMessage)
            ->subject("Your {$serviceName} Purchase Confirmation")
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line("Your {$serviceName} purchase has been confirmed.")
            ->line('')
            ->line('Purchase Details:')
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('Transaction ID: ' . $this->transaction->reference)
            ->line('Service: ' . $serviceName)
            ->line('Amount: ₦' . number_format($this->transaction->amount, 2));

        if ($this->serviceType === 'airtime' || $this->serviceType === 'data') {
            $message->line('Recipient: ' . $this->transaction->recipient);
        }

        if ($this->serviceType === 'electricity') {
            $message->line('Meter Number: ' . ($meta['meter_number'] ?? $this->transaction->recipient))
                   ->line('Meter Type: ' . ucfirst($meta['meter_type'] ?? ''))
                   ->line('Customer Name: ' . ($meta['customer_name'] ?? ''));
            
            if (isset($meta['token']) && $meta['token']) {
                $message->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                       ->line('TOKEN: ' . $meta['token'])
                       ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
            
            if (isset($meta['units']) && $meta['units']) {
                $message->line('Units: ' . $meta['units']);
            }
        }

        if ($this->serviceType === 'cable') {
            $message->line('Smart Card: ' . $this->transaction->recipient)
                   ->line('Provider: ' . ($meta['provider'] ?? ''));
        }

        return $message
            ->line('Status: ' . ucfirst($this->transaction->status))
            ->line('Date: ' . $this->transaction->created_at->format('M d, Y h:i A'))
            ->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            ->line('')
            ->action('View Details', url('/transactions/' . $this->transaction->id))
            ->line('If you have any questions, please contact our support team.')
            ->line('Thank you for using BorrowLite!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'transaction_id' => $this->transaction->id,
            'reference' => $this->transaction->reference,
            'amount' => $this->transaction->amount,
            'status' => $this->transaction->status,
            'service_type' => $this->serviceType,
            'notification_type' => 'purchase_confirmation',
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
