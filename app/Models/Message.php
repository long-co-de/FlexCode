<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'agent_id',
        'message',
        'is_from_user',
        'is_read',
    ];

    protected $casts = [
        'is_from_user' => 'boolean',
        'is_read' => 'boolean',
    ];

    /**
     * Get the conversation that owns the message.
     */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user that owns the message.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the agent that owns the message.
     */
    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
