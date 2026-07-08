<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\FinancialCategory;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Branch
        $branch = Branch::firstOrCreate(
            ['phone' => '081234567890'],
            [
                'branch_name' => 'Lave Shoe Treatment - Pusat',
                'address' => 'Jl. Jenderal Sudirman No. 123',
            ]
        );

        // 2. Seed Roles
        $ownerRole = Role::firstOrCreate(['role_name' => 'Owner']);
        $adminRole = Role::firstOrCreate(['role_name' => 'Admin']);
        $cashierRole = Role::firstOrCreate(['role_name' => 'Kasir']);
        $prodRole = Role::firstOrCreate(['role_name' => 'Staff Produksi']);
        $qcRole = Role::firstOrCreate(['role_name' => 'Quality Control']);

        // 3. Seed Employee (Owner Profile)
        $employee = Employee::firstOrCreate(
            ['employee_code' => 'EMP001'],
            [
                'name' => 'Naufal Ghani',
                'phone' => '081234567890',
                'position' => 'Business Owner',
                'branch_id' => $branch->id,
            ]
        );

        // 4. Seed User (Admin Credentials)
        if (!User::where('username', 'owner')->exists()) {
            User::create([
                'employee_id' => $employee->id,
                'username' => 'owner',
                'email' => 'owner@lave.com',
                'password' => Hash::make('password123'),
                'role_id' => $ownerRole->id,
                'is_active' => true,
            ]);
        }

        // 5. Seed Services
        Service::firstOrCreate(['service_name' => 'Deep Clean'], [
            'price' => 45000.00,
            'estimated_days' => 3,
            'description' => 'Pencucian menyeluruh bagian luar, dalam, insole, dan outsole sepatu.',
            'is_active' => true,
        ]);

        Service::firstOrCreate(['service_name' => 'Fast Clean'], [
            'price' => 25000.00,
            'estimated_days' => 1,
            'description' => 'Pencucian cepat bagian outsole dan midsole saja.',
            'is_active' => true,
        ]);

        Service::firstOrCreate(['service_name' => 'Repaint'], [
            'price' => 150000.00,
            'estimated_days' => 7,
            'description' => 'Pengecatan ulang warna asli sepatu yang pudar.',
            'is_active' => true,
        ]);

        Service::firstOrCreate(['service_name' => 'Unyellowing'], [
            'price' => 75000.00,
            'estimated_days' => 4,
            'description' => 'Menghilangkan efek menguning pada midsole sepatu putih.',
            'is_active' => true,
        ]);

        // 6. Seed Financial Categories
        FinancialCategory::firstOrCreate(['category_name' => 'Pendapatan Jasa Cuci'], ['category_type' => 'Income']);
        FinancialCategory::firstOrCreate(['category_name' => 'Pembelian Sabun & Bahan Kimia'], ['category_type' => 'Expense']);
        FinancialCategory::firstOrCreate(['category_name' => 'Operasional Listrik & Air'], ['category_type' => 'Expense']);
        FinancialCategory::firstOrCreate(['category_name' => 'Gaji Karyawan'], ['category_type' => 'Expense']);
        FinancialCategory::firstOrCreate(['category_name' => 'Peralatan & Aset Baru'], ['category_type' => 'Expense']);
        FinancialCategory::firstOrCreate(['category_name' => 'Marketing & Iklan'], ['category_type' => 'Expense']);
    }
}
