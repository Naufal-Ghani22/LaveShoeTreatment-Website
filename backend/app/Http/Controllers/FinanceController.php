<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Cashflow;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\FinancialCategory;
use App\Models\Income;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function getCategories()
    {
        return response()->json(FinancialCategory::all());
    }

    public function getExpenses(Request $request)
    {
        $query = Expense::with(['financialCategory', 'branch']);
        
        if ($request->has('category_id')) {
            $query->where('financial_category_id', $request->input('category_id'));
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('expense_date', [$request->input('start_date'), $request->input('end_date')]);
        }

        return response()->json($query->orderBy('expense_date', 'desc')->paginate(15));
    }

    public function recordExpense(Request $request)
    {
        $request->validate([
            'financial_category_id' => 'required|exists:financial_categories,id',
            'branch_id' => 'required|exists:branches,id',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $expense = Expense::create([
                'financial_category_id' => $request->financial_category_id,
                'branch_id' => $request->branch_id,
                'amount' => $request->amount,
                'expense_date' => $request->expense_date,
                'description' => $request->description,
            ]);

            // Record to Cashflow Ledger
            $latestCashflow = Cashflow::where('branch_id', $request->branch_id)->orderBy('id', 'desc')->first();
            $newBalance = ($latestCashflow ? $latestCashflow->current_balance : 0.00) - $request->amount;

            Cashflow::create([
                'branch_id' => $request->branch_id,
                'transaction_type' => 'Out',
                'amount' => $request->amount,
                'reference_table' => 'expenses',
                'reference_id' => $expense->id,
                'transaction_date' => $request->expense_date,
                'current_balance' => $newBalance,
            ]);

            return response()->json([
                'message' => 'Pengeluaran berhasil dicatat dan arus kas diperbarui.',
                'expense' => $expense,
                'current_balance' => $newBalance
            ], 201);
        });
    }

    public function getIncomes(Request $request)
    {
        $query = Income::with(['financialCategory', 'branch']);
        
        if ($request->has('category_id')) {
            $query->where('financial_category_id', $request->input('category_id'));
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('income_date', [$request->input('start_date'), $request->input('end_date')]);
        }

        return response()->json($query->orderBy('income_date', 'desc')->paginate(15));
    }

    public function recordIncome(Request $request)
    {
        $request->validate([
            'financial_category_id' => 'required|exists:financial_categories,id',
            'branch_id' => 'required|exists:branches,id',
            'amount' => 'required|numeric|min:0',
            'income_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $income = Income::create([
                'financial_category_id' => $request->financial_category_id,
                'branch_id' => $request->branch_id,
                'amount' => $request->amount,
                'income_date' => $request->income_date,
                'description' => $request->description,
            ]);

            // Record to Cashflow Ledger
            $latestCashflow = Cashflow::where('branch_id', $request->branch_id)->orderBy('id', 'desc')->first();
            $newBalance = ($latestCashflow ? $latestCashflow->current_balance : 0.00) + $request->amount;

            Cashflow::create([
                'branch_id' => $request->branch_id,
                'transaction_type' => 'In',
                'amount' => $request->amount,
                'reference_table' => 'incomes',
                'reference_id' => $income->id,
                'transaction_date' => $request->income_date,
                'current_balance' => $newBalance,
            ]);

            return response()->json([
                'message' => 'Pemasukan manual berhasil dicatat dan arus kas diperbarui.',
                'income' => $income,
                'current_balance' => $newBalance
            ], 201);
        });
    }

    public function getCashflows(Request $request)
    {
        $query = Cashflow::query();
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [$request->input('start_date'), $request->input('end_date')]);
        }

        return response()->json($query->orderBy('id', 'desc')->paginate(15));
    }

    public function getBusinessPerformance(Request $request)
    {
        $branchId = $request->query('branch_id', 1);

        // 1. Total Inflow (Revenue) & Outflow (Expenses)
        $totalRevenue = (double) Income::where('branch_id', $branchId)->sum('amount');
        $totalExpenses = (double) Expense::where('branch_id', $branchId)->sum('amount');
        
        // 2. Calculate Asset Depreciation automatically
        $assets = Asset::where('branch_id', $branchId)->get();
        $totalDepreciation = 0.00;
        foreach ($assets as $asset) {
            $purchaseDate = $asset->purchase_date;
            $monthsElapsed = $purchaseDate->diffInMonths(now());
            $monthsToDepreciate = min($asset->useful_months, $monthsElapsed);
            $depreciatedAmount = $asset->monthly_depreciation * $monthsToDepreciate;
            $totalDepreciation += $asset->monthly_depreciation; // Current month's depreciation expense
            
            // Sync accumulated value in DB
            $asset->update(['accumulated_depreciation' => min($asset->purchase_price - $asset->residual_value, $depreciatedAmount)]);
        }

        $netProfit = $totalRevenue - $totalExpenses - $totalDepreciation;

        // 3. Repeat Customer Rate
        $totalCustomers = Customer::count();
        $repeatCustomers = Customer::where('total_orders', '>', 1)->count();
        $repeatCustomerRate = $totalCustomers > 0 ? ($repeatCustomers / $totalCustomers) * 100 : 0;

        // 4. Average Order Value (AOV)
        $completedOrdersCount = Order::where('status', 'Completed')->count();
        $completedOrdersRevenue = (double) Order::where('status', 'Completed')->sum('total_price');
        $averageOrderValue = $completedOrdersCount > 0 ? $completedOrdersRevenue / $completedOrdersCount : 0;

        // 5. Customer Lifetime Value (LTV)
        $averagePurchaseFrequency = $totalCustomers > 0 ? Order::count() / $totalCustomers : 0;
        $customerLifetimeValue = $averageOrderValue * $averagePurchaseFrequency;

        // 6. Break-Even Point (BEP) Analysis
        $fixedCosts = (double) Expense::where('branch_id', $branchId)
            ->whereIn('financial_category_id', [3, 4]) // Listrik/Air, Gaji Karyawan
            ->sum('amount');

        $variableCosts = (double) Expense::where('branch_id', $branchId)
            ->whereIn('financial_category_id', [2]) // Sabun & Bahan Kimia
            ->sum('amount');

        $totalOrderCount = Order::count();
        $variableCostPerOrder = $totalOrderCount > 0 ? $variableCosts / $totalOrderCount : 0.00;

        $avgServicePrice = Service::where('is_active', true)->avg('price') ?? 45000.00;
        $denominator = $avgServicePrice - $variableCostPerOrder;
        $bepUnits = $denominator > 0 ? ceil($fixedCosts / $denominator) : 0;
        $bepRevenueValue = $bepUnits * $avgServicePrice;

        // 7. Monthly Cashflow Trend (Last 6 Months)
        $driver = DB::getDriverName();
        $dateFormatIncome = $driver === 'sqlite' ? "strftime('%Y-%m', income_date)" : "DATE_FORMAT(income_date, '%Y-%m')";
        $dateFormatExpense = $driver === 'sqlite' ? "strftime('%Y-%m', expense_date)" : "DATE_FORMAT(expense_date, '%Y-%m')";

        $monthlyIncomes = DB::table('incomes')
            ->select(DB::raw("{$dateFormatIncome} as month"), DB::raw("SUM(amount) as total"))
            ->where('branch_id', $branchId)
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->limit(6)
            ->get();

        $monthlyExpenses = DB::table('expenses')
            ->select(DB::raw("{$dateFormatExpense} as month"), DB::raw("SUM(amount) as total"))
            ->where('branch_id', $branchId)
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->limit(6)
            ->get();

        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = date('Y-m', strtotime("-{$i} month"));
            $incVal = (double) ($monthlyIncomes->firstWhere('month', $m)->total ?? 0.00);
            $expVal = (double) ($monthlyExpenses->firstWhere('month', $m)->total ?? 0.00);
            $trend[] = [
                'month' => $m,
                'income' => $incVal,
                'expense' => $expVal,
            ];
        }

        return response()->json([
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'monthly_depreciation_expense' => $totalDepreciation,
                'net_profit' => $netProfit,
                'current_balance' => (double) (Cashflow::where('branch_id', $branchId)->orderBy('id', 'desc')->value('current_balance') ?? 0.00),
            ],
            'kpis' => [
                'repeat_customer_rate' => round($repeatCustomerRate, 1),
                'average_order_value' => round($averageOrderValue, 2),
                'customer_lifetime_value' => round($customerLifetimeValue, 2),
                'total_customers' => $totalCustomers,
                'repeat_customers' => $repeatCustomers,
            ],
            'bep_analysis' => [
                'fixed_costs' => $fixedCosts,
                'variable_cost_per_order' => round($variableCostPerOrder, 2),
                'average_service_price' => round($avgServicePrice, 2),
                'bep_target_orders' => $bepUnits,
                'bep_revenue_threshold' => $bepRevenueValue,
            ],
            'trend' => $trend,
            'assets' => $assets
        ]);
    }

    public function getAssets(Request $request)
    {
        return response()->json(Asset::where('branch_id', $request->query('branch_id', 1))->get());
    }

    public function recordAsset(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'asset_name' => 'required|string|max:100',
            'purchase_price' => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
            'useful_months' => 'required|integer|min:1',
            'residual_value' => 'nullable|numeric|min:0',
        ]);

        $residual = $request->residual_value ?? 0.00;
        $monthlyDepr = ($request->purchase_price - $residual) / $request->useful_months;

        $asset = Asset::create([
            'branch_id' => $request->branch_id,
            'asset_name' => $request->asset_name,
            'purchase_price' => $request->purchase_price,
            'purchase_date' => $request->purchase_date,
            'useful_months' => $request->useful_months,
            'residual_value' => $residual,
            'monthly_depreciation' => round($monthlyDepr, 2),
            'accumulated_depreciation' => 0.00,
        ]);

        return response()->json([
            'message' => 'Aset inventaris berhasil dicatat.',
            'asset' => $asset
        ], 201);
    }
}
