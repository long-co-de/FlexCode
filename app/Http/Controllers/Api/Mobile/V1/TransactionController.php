<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::where('user_id', $request->user()->id);

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('status')) {
            $statuses = $request->status === 'successful' ? ['successful', 'success'] : [$request->status];
            $query->whereIn('status', $statuses);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $transactions = $query->latest()->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($transactions, TransactionResource::collection($transactions), 'Transactions fetched successfully.');
    }

    public function show(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) {
            return $this->error('Unauthorized access to this transaction.', 'UNAUTHORIZED_TRANSACTION_ACCESS', 403);
        }

        return $this->success(new TransactionResource($transaction), 'Transaction fetched successfully.');
    }
}
