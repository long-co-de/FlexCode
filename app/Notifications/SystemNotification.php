<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class SystemNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $title;
    protected $message;
    protected $type;
    protected $action;
    protected $actionUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $title, string $message, string $type = 'info', string $action = null, string $actionUrl = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->action = $action;
        $this->actionUrl = $actionUrl;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // if ($notifiable->email_notifications && $notifiable->system_notifications) {
        //     $channels[] = 'mail';
        // }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    // public function toMail(object $notifiable): MailMessage
    // {
    //     $mail = (new MailMessage)
    //         ->subject($this->title)
    //         ->greeting('Hello ' . $notifiable->name)
    //         ->line($this->message);

    //     if ($this->action && $this->actionUrl) {
    //         $mail->action($this->action, url($this->actionUrl));
    //     }

    //     return $mail->line('Thank you for using our application!');
    // }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'action' => $this->action,
            'action_url' => $this->actionUrl,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    // public function toBroadcast(object $notifiable): BroadcastMessage
    // {
    //     return new BroadcastMessage([
    //         'title' => $this->title,
    //         'message' => $this->message,
    //         'type' => $this->type,
    //         'action' => $this->action,
    //         'action_url' => $this->actionUrl,
    //         'time' => now()->toIso8601String(),
    //     ]);
    // }
}
