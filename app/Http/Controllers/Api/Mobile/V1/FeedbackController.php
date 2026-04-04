<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\FeedbackResource;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $feedback = Feedback::where('user_id', $request->user()->id)->latest()->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($feedback, FeedbackResource::collection($feedback), 'Feedback history fetched successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:bug,feature_request,improvement,general',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
            'feature_request' => 'boolean',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        $feedback = Feedback::create(array_merge($validated, [
            'user_id' => $request->user()->id,
        ]));

        return $this->success(new FeedbackResource($feedback), 'Thank you for your feedback!', 201);
    }

    public function show(Request $request, Feedback $feedback)
    {
        if ($feedback->user_id !== $request->user()->id) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED_FEEDBACK_ACCESS', 403);
        }

        return $this->success(new FeedbackResource($feedback), 'Feedback fetched successfully.');
    }
}
