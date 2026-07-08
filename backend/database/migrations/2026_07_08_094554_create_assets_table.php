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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('asset_name', 100);
            $table->decimal('purchase_price', 12, 2);
            $table->date('purchase_date');
            $table->integer('useful_months');
            $table->decimal('residual_value', 12, 2)->default(0.00);
            $table->decimal('monthly_depreciation', 12, 2);
            $table->decimal('accumulated_depreciation', 12, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
