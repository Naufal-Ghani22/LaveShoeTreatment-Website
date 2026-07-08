<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'order_id',
        'payment_method',
        'payment_status',
        'paid_amount',
        'payment_date',
        'reference_number',
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'paid_amount' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
