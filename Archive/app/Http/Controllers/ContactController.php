<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Display the contact us page.
     */
    public function index()
    {
        $user = Auth::user();
        $messages = [];

        // If user is logged in, get their conversation messages
        if ($user) {
            $conversation = Conversation::where('user_id', $user->id)
                ->where('status', 'open')
                ->first();

            if ($conversation) {
                $messages = $conversation->messages()
                    ->with(['user:id,name', 'agent:id,name'])
                    ->get()
                    ->map(function ($message) use ($user) {
                        return [
                            'id' => $message->id,
                            'message' => $message->message,
                            'is_from_user' => $message->is_from_user,
                            'created_at' => $message->created_at->diffForHumans(),
                            'user' => $message->is_from_user ? $message->user : $message->agent,
                        ];
                    });
            }
        }

        // Get contact information from settings
        $contactInfo = [
            'phone' => Setting::get('contact_phone', '+234 123 456 7890'),
            'email' => Setting::get('contact_email', 'support@example.com'),
            'address' => Setting::get('contact_address', '123 Main Street, Lagos, Nigeria'),
            'social' => [
                'facebook' => Setting::get('social_facebook', '#'),
                'twitter' => Setting::get('social_twitter', '#'),
                'instagram' => Setting::get('social_instagram', '#'),
            ],
        ];

        return Inertia::render('ContactUs', [
            'auth' => [
                'user' => $user,
            ],
            'messages' => $messages,
            'contactInfo' => $contactInfo,
        ]);
    }

    /**
     * Submit a contact form.
     */
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        // Create a new conversation if user is logged in
        if (Auth::check()) {
            $user = Auth::user();

            // Check if user already has an open conversation
            $conversation = Conversation::where('user_id', $user->id)
                ->where('status', 'open')
                ->first();

            if (!$conversation) {
                $conversation = Conversation::create([
                    'user_id' => $user->id,
                    'subject' => $validated['subject'],
                    'status' => 'open',
                    'last_message_at' => now(),
                ]);
            }

            // Create a new message
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'message' => $validated['message'],
                'is_from_user' => true,
                'is_read' => false,
            ]);

            return redirect()->back()->with('success', 'Your message has been sent successfully. We will get back to you soon.');
        }

        // For non-logged in users, just store the contact form data
        \App\Models\ContactForm::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
        ]);

        return redirect()->back()->with('success', 'Your message has been sent successfully. We will get back to you soon.');
    }

    /**
     * Send a chat message.
     */
    public function sendChatMessage(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $user = Auth::user();

        // Check if user already has an open conversation
        $conversation = Conversation::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'user_id' => $user->id,
                'subject' => 'Live Chat',
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        } else {
            $conversation->update([
                'last_message_at' => now(),
            ]);
        }

        // Create a new message
        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
            'is_from_user' => true,
            'is_read' => false,
        ]);

        return redirect()->back();
    }
}
