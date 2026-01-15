<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Transaction;

class TransactionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $transaction;
    protected $message;
    protected $type;

    /**
     * Create a new notification instance.
     */
    public function __construct(Transaction $transaction, string $message, string $type = 'info')
    {
        $this->transaction = $transaction;
        $this->message = $message;
        $this->type = $type;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($notifiable->email_notifications && $notifiable->transaction_notifications) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Transaction Notification')
            ->greeting('Hello ' . $notifiable->name)
            ->line($this->message)
            ->line('Transaction Details:')
            ->line('Reference: ' . $this->transaction->reference)
            ->line('Amount: ₦' . number_format($this->transaction->amount, 2))
            ->line('Status: ' . ucfirst($this->transaction->status))
            ->line('Type: ' . ucfirst(str_replace('_', ' ', $this->transaction->type)))
            ->line('Date: ' . $this->transaction->created_at->format('M d, Y h:i A'))
            ->action('View Transaction', url('/transactions/' . $this->transaction->id))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'transaction_id' => $this->transaction->id,
            'reference' => $this->transaction->reference,
            'amount' => $this->transaction->amount,
            'status' => $this->transaction->status,
            'type' => $this->transaction->type,
            'message' => $this->message,
            'notification_type' => $this->type,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    // public function toBroadcast(object $notifiable): BroadcastMessage
    // {
    //     return new BroadcastMessage([
    //         'transaction' => [
    //             'id' => $this->transaction->id,
    //             'reference' => $this->transaction->reference,
    //             'amount' => $this->transaction->amount,
    //             'status' => $this->transaction->status,
    //             'type' => $this->transaction->type,
    //         ],
    //         'message' => $this->message,
    //         'type' => $this->type,
    //         'time' => now()->toIso8601String(),
    //     ]);
    // }
}
