<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the agent dashboard.
     */
    public function index()
    {
        $agent = Auth::user();

        // Get agent stats
        $stats = [
            'pendingTransactions' => Transaction::where('status', 'pending')->count(),
            'verifiedToday' => Transaction::where('status', 'success')
                ->whereDate('updated_at', today())
                ->where('verified_by', $agent->id)
                ->count(),
            'unreadMessages' => Message::whereHas('conversation', function ($query) {
                $query->where('status', 'open');
            })
            ->where('is_from_user', true)
            ->where('is_read', false)
            ->count(),
        ];

        // Get pending transactions
        $pendingTransactions = Transaction::with('user:id,name,email')
            ->where('status', 'pending')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'user' => $transaction->user,
                    'type' => $transaction->type,
                    'amount' => number_format($transaction->amount, 2),
                    'created_at' => $transaction->created_at->diffForHumans(),
                ];
            });

        // Get recent messages
        $recentMessages = Message::with(['conversation', 'user:id,name,email'])
            ->whereHas('conversation', function ($query) {
                $query->where('status', 'open');
            })
            ->where('is_from_user', true)
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'user' => $message->user,
                    'message' => $message->message,
                    'created_at' => $message->created_at->diffForHumans(),
                    'is_read' => $message->is_read,
                ];
            });

        return Inertia::render('Agent/Dashboard', [
            'auth' => [
                'user' => $agent,
            ],
            'stats' => $stats,
            'pendingTransactions' => $pendingTransactions,
            'recentMessages' => $recentMessages,
        ]);
    }
}
