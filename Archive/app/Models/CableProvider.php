<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CableProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'logo',
        'status',
    ];

    public function cablePlans()
    {
        return $this->hasMany(CablePlan::class);
    }
}