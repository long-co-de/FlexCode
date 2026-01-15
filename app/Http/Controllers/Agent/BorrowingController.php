<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use Inertia\Inertia;
use Illuminate\Http\Request;

class BorrowingController extends Controller
{
    public function index(Request $request)
    {
        $borrowings = Borrowing::with('user')
            ->paginate(15);

        return Inertia::render('Agent/Borrowings/Index', [
            'borrowings' => $borrowings,
        ]);
    }

    public function show(Borrowing $borrowing)
    {
        $borrowing->load('user');

        return Inertia::render('Agent/Borrowings/Show', [
            'borrowing' => $borrowing,
        ]);
    }

    public function approve(Request $request, Borrowing $borrowing)
    {
        $borrowing->update(['status' => 'active']);

        return redirect()->back()->with('message', 'Borrowing approved successfully');
    }

    public function reject(Request $request, Borrowing $borrowing)
    {
        $borrowing->update(['status' => 'rejected']);

        return redirect()->back()->with('message', 'Borrowing rejected successfully');
    }

    public function markPaid(Request $request, Borrowing $borrowing)
    {
        $borrowing->update(['status' => 'paid']);

        return redirect()->back()->with('message', 'Borrowing marked as paid');
    }
}
