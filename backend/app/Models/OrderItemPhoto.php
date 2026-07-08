<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemPhoto extends Model
{
    protected $fillable = [
        'order_item_id',
        'photo_type',
        'photo_url',
        'cloudinary_public_id',
    ];

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
