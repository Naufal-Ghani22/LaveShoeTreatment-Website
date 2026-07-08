<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication Route
Route::post('/login', [AuthController::class, 'login']);
Route::get('/orders/track', [OrderController::class, 'trackPublic']);

// Authenticated Routes (Secure via Laravel Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    
    // User Session info
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Customer Management
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);

    // Service Management
    Route::get('/services', [ServiceController::class, 'index']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);

    // Order Processing
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::post('/orders/{id}/pay', [OrderController::class, 'recordPayment']);
    Route::get('/orders/{id}/wa-link', [OrderController::class, 'generateWaTemplate']);

    // Finance & Cashflow
    Route::get('/finance/categories', [FinanceController::class, 'getCategories']);
    Route::get('/finance/expenses', [FinanceController::class, 'getExpenses']);
    Route::post('/finance/expenses', [FinanceController::class, 'recordExpense']);
    Route::get('/finance/incomes', [FinanceController::class, 'getIncomes']);
    Route::post('/finance/incomes', [FinanceController::class, 'recordIncome']);
    Route::get('/finance/cashflows', [FinanceController::class, 'getCashflows']);
    Route::get('/finance/performance', [FinanceController::class, 'getBusinessPerformance']);
    Route::get('/finance/assets', [FinanceController::class, 'getAssets']);
    Route::post('/finance/assets', [FinanceController::class, 'recordAsset']);
});
