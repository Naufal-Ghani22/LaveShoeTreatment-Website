<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = ['branch_name', 'address', 'phone'];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
