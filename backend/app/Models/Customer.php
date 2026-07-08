<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'customer_code',
        'full_name',
        'phone',
        'email',
        'gender',
        'birth_date',
        'total_orders',
        'total_spent',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function loyaltyAccount(): HasOne
    {
        return $this->hasOne(LoyaltyAccount::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
