<?php

namespace App\Policies;

use App\Models\Beneficiary;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BeneficiaryPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function viewAny(User $user)
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Beneficiary  $beneficiary
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function view(User $user, Beneficiary $beneficiary)
    {
        return $user->id === $beneficiary->user_id;
    }

    /**
     * Determine whether the user can create models.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function create(User $user)
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Beneficiary  $beneficiary
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function update(User $user, Beneficiary $beneficiary)
    {
        return $user->id === $beneficiary->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Beneficiary  $beneficiary
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function delete(User $user, Beneficiary $beneficiary)
    {
        return $user->id === $beneficiary->user_id;
    }
}