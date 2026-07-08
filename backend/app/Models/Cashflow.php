<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cashflow extends Model
{
    protected $fillable = [
        'branch_id',
        'transaction_type',
        'amount',
        'reference_table',
        'reference_id',
        'transaction_date',
        'current_balance',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
