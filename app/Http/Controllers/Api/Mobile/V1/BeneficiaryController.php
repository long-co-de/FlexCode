<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Resources\Mobile\V1\BeneficiaryResource;
use App\Models\Beneficiary;
use Illuminate\Http\Request;

class BeneficiaryController extends Controller
{
    public function index(Request $request)
    {
        $query = Beneficiary::where('user_id', $request->user()->id)->with('network');

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('service_type', $request->type);
        }

        $beneficiaries = $query->orderByDesc('is_favorite')->orderBy('name')->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($beneficiaries, BeneficiaryResource::collection($beneficiaries), 'Beneficiaries fetched successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'service_type' => 'required|string|in:airtime,data,cable,electricity,bank_transfer',
            'network_id' => 'nullable|exists:networks,id',
            'is_favorite' => 'boolean',
            'meta_data' => 'nullable|array',
        ]);

        $beneficiary = Beneficiary::create(array_merge($validated, [
            'user_id' => $request->user()->id,
        ]));

        return $this->success(new BeneficiaryResource($beneficiary->load('network')), 'Beneficiary created successfully.', 201);
    }

    public function update(Request $request, Beneficiary $beneficiary)
    {
        $this->authorize('update', $beneficiary);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
            'service_type' => 'required|string|in:airtime,data,cable,electricity,bank_transfer',
            'network_id' => 'nullable|exists:networks,id',
            'is_favorite' => 'boolean',
            'meta_data' => 'nullable|array',
        ]);

        $beneficiary->update($validated);

        return $this->success(new BeneficiaryResource($beneficiary->fresh()->load('network')), 'Beneficiary updated successfully.');
    }

    public function toggleFavorite(Beneficiary $beneficiary)
    {
        $this->authorize('update', $beneficiary);
        $beneficiary->update(['is_favorite' => ! $beneficiary->is_favorite]);

        return $this->success(new BeneficiaryResource($beneficiary->fresh()->load('network')), 'Beneficiary favorite status updated.');
    }

    public function destroy(Beneficiary $beneficiary)
    {
        $this->authorize('delete', $beneficiary);
        $beneficiary->delete();

        return $this->success(null, 'Beneficiary deleted successfully.');
    }
}
