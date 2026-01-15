<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Transaction;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = User::query()->where('role', 'user');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('Agent/Users/Index', [
            'users' => $users,
            'filter' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Display the specified user.
     *
     * @param  \App\Models\User  $user
     * @return \Inertia\Response
     */
    public function show(User $user)
    {
        if ($user->role !== 'user') {
            abort(403, 'Unauthorized action.');
        }

        $transactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Agent/Users/Show', [
            'user' => $user,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Toggle active status for a user.
     */
    public function toggleActive(User $user)
    {
        if ($user->role !== 'user') {
            abort(403, 'Unauthorized action.');
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return back()->with('success', 'User '.($user->is_active ? 'enabled' : 'disabled').' successfully.');
    }
}
