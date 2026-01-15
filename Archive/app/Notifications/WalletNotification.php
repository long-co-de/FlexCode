<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class WalletNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $amount;
    protected $message;
    protected $type;
    protected $reference;

    /**
     * Create a new notification instance.
     */
    public function __construct(float $amount, string $message, string $type = 'credit', ?string $reference = null)
    {
        $this->amount = $amount;
        $this->message = $message;
        $this->type = $type;
        $this->reference = $reference;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->type === 'credit' ? 'Wallet Credit Alert' : 'Wallet Debit Alert';

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Hello ' . $notifiable->name)
            ->line($this->message)
            ->line('Amount: ₦' . number_format($this->amount, 2))
            ->line('Reference: ' . ($this->reference ?? 'N/A'))
            ->line('Date: ' . now()->format('M d, Y h:i A'))
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
            'amount' => $this->amount,
            'message' => $this->message,
            'type' => $this->type,
            'reference' => $this->reference,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    // public function toBroadcast(object $notifiable): BroadcastMessage
    // {
    //     return new BroadcastMessage([
    //         'amount' => $this->amount,
    //         'message' => $this->message,
    //         'type' => $this->type,
    //         'reference' => $this->reference,
    //         'time' => now()->toIso8601String(),
    //     ]);
    // }
}
