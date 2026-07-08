<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asset extends Model
{
    protected $fillable = [
        'branch_id',
        'asset_name',
        'purchase_price',
        'purchase_date',
        'useful_months',
        'residual_value',
        'monthly_depreciation',
        'accumulated_depreciation',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'purchase_price' => 'decimal:2',
        'residual_value' => 'decimal:2',
        'monthly_depreciation' => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
