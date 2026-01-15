<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Store feedback from the dashboard
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:bug,feature_request,improvement,general',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
            'feature_request' => 'boolean',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        $feedback = Feedback::create([
            'user_id' => $request->user()->id,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'message' => $validated['message'],
            'feature_request' => $validated['feature_request'] ?? false,
            'rating' => $validated['rating'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback! We appreciate your input.',
            'data' => $feedback,
        ]);
    }

    /**
     * Get user's feedback history
     */
    public function index(Request $request)
    {
        $feedbacks = Feedback::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($feedbacks);
    }

    /**
     * Get feedback by ID
     */
    public function show(Request $request, Feedback $feedback)
    {
        if ($feedback->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json($feedback);
    }
}
