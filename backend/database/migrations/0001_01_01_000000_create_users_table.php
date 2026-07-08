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
        // 1. Branches Table
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('branch_name', 100);
            $table->text('address')->nullable();
            $table->string('phone', 20)->nullable();
            $table->timestamps();
        });

        // 2. Roles Table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('role_name', 50)->unique();
        });

        // 3. Employees Table
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_code', 20)->unique();
            $table->string('name', 100);
            $table->string('phone', 20)->nullable();
            $table->string('position', 50)->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->timestamps();
        });

        // 4. Users Table (Auth)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->nullable()->unique()->constrained('employees')->onDelete('cascade');
            $table->string('username', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('password');
            $table->foreignId('role_id')->constrained('roles');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // 5. Password Reset Tokens Table (Default)
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // 6. Sessions Table (Default)
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('branches');
    }
};
