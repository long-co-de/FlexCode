<?php

namespace App\Http\Controllers\Admin;

use App\Models\Feedback;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    /**
     * Display a listing of all feedback.
     */
    public function index(Request $request)
    {
        $query = Feedback::with('user');

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by rating
        if ($request->has('rating') && $request->rating !== 'all') {
            $rating = (int) $request->rating;
            if ($rating > 0) {
                $query->where('rating', '>=', $rating);
            }
        }

        // Search by title or message
        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQ) use ($search) {
                        $userQ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by feature request
        if ($request->has('feature_request') && $request->feature_request !== 'all') {
            $isFeatureRequest = $request->feature_request === 'true';
            $query->where('feature_request', $isFeatureRequest);
        }

        // Sort options
        $sort = $request->get('sort', 'created_at');
        $direction = $request->get('direction', 'desc');

        switch ($sort) {
            case 'rating':
                $query->orderBy('rating', $direction);
                break;
            case 'status':
                $query->orderBy('status', $direction);
                break;
            case 'category':
                $query->orderBy('category', $direction);
                break;
            case 'created_at':
            default:
                $query->orderBy('created_at', $direction);
        }

        $feedback = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Feedback/Index', [
            'feedback' => $feedback,
            'filters' => [
                'category' => $request->get('category', 'all'),
                'status' => $request->get('status', 'all'),
                'rating' => $request->get('rating', 'all'),
                'search' => $request->get('search', ''),
                'feature_request' => $request->get('feature_request', 'all'),
                'sort' => $sort,
                'direction' => $direction,
            ],
            'stats' => [
                'total' => Feedback::count(),
                'open' => Feedback::where('status', 'open')->count(),
                'in_progress' => Feedback::where('status', 'in_progress')->count(),
                'resolved' => Feedback::where('status', 'resolved')->count(),
                'closed' => Feedback::where('status', 'closed')->count(),
                'feature_requests' => Feedback::where('feature_request', true)->count(),
                'avg_rating' => round(Feedback::whereNotNull('rating')->avg('rating'), 1),
            ],
        ]);
    }

    /**
     * Display the specified feedback.
     */
    public function show(Feedback $feedback)
    {
        $feedback->load('user');

        return Inertia::render('Admin/Feedback/Show', [
            'feedback' => $feedback,
        ]);
    }

    /**
     * Update the status of feedback.
     */
    public function updateStatus(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $feedback->update([
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Feedback status updated successfully.');
    }

    /**
     * Add admin response to feedback.
     */
    public function respond(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'admin_response' => 'required|string|max:5000',
            'status' => 'nullable|in:open,in_progress,resolved,closed',
        ]);

        $feedback->update([
            'admin_response' => $validated['admin_response'],
            'responded_at' => now(),
            'status' => $validated['status'] ?? 'resolved',
        ]);

        return back()->with('success', 'Response saved successfully.');
    }

    /**
     * Get feedback statistics.
     */
    public function statistics()
    {
        $stats = [
            'total' => Feedback::count(),
            'by_category' => Feedback::groupBy('category')
                ->selectRaw('category, count(*) as count')
                ->pluck('count', 'category')
                ->toArray(),
            'by_status' => Feedback::groupBy('status')
                ->selectRaw('status, count(*) as count')
                ->pluck('count', 'status')
                ->toArray(),
            'by_rating' => Feedback::whereNotNull('rating')
                ->groupBy('rating')
                ->selectRaw('rating, count(*) as count')
                ->pluck('count', 'rating')
                ->toArray(),
            'feature_requests' => Feedback::where('feature_request', true)->count(),
            'avg_rating' => round(Feedback::whereNotNull('rating')->avg('rating'), 1),
            'response_rate' => round(
                (Feedback::whereNotNull('responded_at')->count() / max(Feedback::count(), 1)) * 100,
                1
            ),
            'avg_response_time' => null, // Can be calculated with timestamps
        ];

        return Inertia::render('Admin/Feedback/Statistics', [
            'stats' => $stats,
        ]);
    }
}
