<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->enum('payment_method', ['Cash', 'QRIS', 'Transfer', 'E-Wallet']);
            $table->enum('payment_status', ['Pending', 'Paid', 'Refunded'])->default('Pending');
            $table->decimal('paid_amount', 12, 2)->default(0.00);
            $table->dateTime('payment_date')->nullable();
            $table->string('reference_number', 50)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
