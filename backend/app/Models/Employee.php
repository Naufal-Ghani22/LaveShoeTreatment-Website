<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = ['employee_code', 'name', 'phone', 'position', 'branch_id'];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class);
    }
}
