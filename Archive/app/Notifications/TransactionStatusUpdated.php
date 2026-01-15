<?php

namespace App\Notifications;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TransactionStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $transaction;

    /**
     * Create a new notification instance.
     */
    public function __construct(Transaction $transaction)
    {
        $this->transaction = $transaction;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $status = ucfirst($this->transaction->status);
        $statusColor = $this->transaction->status === 'success' ? 'green' : 'red';

        return (new MailMessage)
            ->subject("Transaction {$status}: {$this->transaction->reference}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your transaction with reference {$this->transaction->reference} has been marked as {$this->transaction->status}.")
            ->line("Transaction Details:")
            ->line("- Type: " . ucfirst(str_replace('_', ' ', $this->transaction->type)))
            ->line("- Amount: ₦" . number_format($this->transaction->amount, 2))
            ->line("- Date: " . $this->transaction->created_at->format('M d, Y h:i A'))
            ->line("- Status: <span style='color: {$statusColor};'>{$status}</span>")
            ->action('View Transaction', url(route('transactions.show', $this->transaction->id)))
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
            'type' => $this->transaction->type,
            'amount' => $this->transaction->amount,
            'status' => $this->transaction->status,
            'title' => "Transaction " . ucfirst($this->transaction->status),
            'message' => "Your transaction with reference {$this->transaction->reference} has been marked as {$this->transaction->status}.",
        ];
    }
}
