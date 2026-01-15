<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MessageController extends Controller
{
    /**
     * Display a listing of the conversations.
     */
    public function index()
    {
        $agent = Auth::user();

        // Get all open conversations
        $conversations = Conversation::with('user:id,name,email')
            ->where('status', 'open')
            ->latest('last_message_at')
            ->get()
            ->map(function ($conversation) {
                $lastMessage = $conversation->messages()->latest()->first();
                $unreadCount = $conversation->messages()
                    ->where('is_from_user', true)
                    ->where('is_read', false)
                    ->count();

                return [
                    'id' => $conversation->id,
                    'user' => $conversation->user,
                    'subject' => $conversation->subject,
                    'status' => $conversation->status,
                    'last_message' => $lastMessage ? $lastMessage->message : null,
                    'last_message_at' => $conversation->last_message_at ? $conversation->last_message_at->diffForHumans() : null,
                    'unread_count' => $unreadCount,
                ];
            });

        return Inertia::render('Agent/Messages', [
            'auth' => [
                'user' => $agent,
            ],
            'conversations' => $conversations,
        ]);
    }

    /**
     * Display the specified conversation.
     */
    public function showConversation(Conversation $conversation)
    {
        $agent = Auth::user();

        // Mark all unread messages from user as read
        $conversation->messages()
            ->where('is_from_user', true)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        // Assign the agent to the conversation if not already assigned
        if (!$conversation->agent_id) {
            $conversation->update([
                'agent_id' => $agent->id,
            ]);
        }

        // Get all conversations for the sidebar
        $conversations = Conversation::with('user:id,name,email')
            ->where('status', 'open')
            ->latest('last_message_at')
            ->get()
            ->map(function ($conv) {
                $lastMessage = $conv->messages()->latest()->first();
                $unreadCount = $conv->messages()
                    ->where('is_from_user', true)
                    ->where('is_read', false)
                    ->count();

                return [
                    'id' => $conv->id,
                    'user' => $conv->user,
                    'subject' => $conv->subject,
                    'status' => $conv->status,
                    'last_message' => $lastMessage ? $lastMessage->message : null,
                    'last_message_at' => $conv->last_message_at ? $conv->last_message_at->diffForHumans() : null,
                    'unread_count' => $unreadCount,
                ];
            });

        // Get the conversation messages
        $messages = $conversation->messages()
            ->with(['user:id,name', 'agent:id,name'])
            ->orderBy('created_at')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'is_from_user' => $message->is_from_user,
                    'created_at' => $message->created_at->diffForHumans(),
                    'user' => $message->is_from_user ? $message->user : $message->agent,
                ];
            });

        // Load the conversation user
        $conversation->load('user:id,name,email');

        return Inertia::render('Agent/Messages', [
            'auth' => [
                'user' => $agent,
            ],
            'conversations' => $conversations,
            'activeConversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message in the conversation.
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'required|exists:conversations,id',
        ]);

        $agent = Auth::user();
        $conversation = Conversation::findOrFail($validated['conversation_id']);

        // Create a new message
        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $conversation->user_id,
            'agent_id' => $agent->id,
            'message' => $validated['message'],
            'is_from_user' => false,
            'is_read' => true, // Agent's messages are always read
        ]);

        // Update the conversation last_message_at
        $conversation->update([
            'last_message_at' => now(),
            'agent_id' => $agent->id, // Assign the agent if not already assigned
        ]);

        return redirect()->back();
    }

    /**
     * Close the conversation.
     */
    public function closeConversation(Conversation $conversation)
    {
        $conversation->update([
            'status' => 'closed',
        ]);

        return redirect()->route('agent.messages')->with('success', 'Conversation closed successfully.');
    }
}
