<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class AdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $title;
    protected $message;
    protected $type;
    protected $action;
    protected $actionUrl;
    protected $target;
    protected $sentCount;
    protected $sentBy;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        string $title, 
        string $message, 
        string $type = 'info', 
        ?string $action = null, 
        ?string $actionUrl = null,
        ?string $target = null,
        ?int $sentCount = null,
        ?int $sentBy = null
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->action = $action;
        $this->actionUrl = $actionUrl;
        $this->target = $target;
        $this->sentCount = $sentCount;
        $this->sentBy = $sentBy;
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
            'target' => $this->target,
            'sent_count' => $this->sentCount,
            'sent_by' => $this->sentBy,
            'sent_at' => now(),
        ];
    }
}