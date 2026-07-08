<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\LoyaltyAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with('loyaltyAccount');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('customer_code', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:100',
            'phone' => 'required|string|max:20|unique:customers,phone',
            'email' => 'nullable|email|max:100',
            'gender' => 'nullable|in:L,P',
            'birth_date' => 'nullable|date',
        ]);

        // Generate unique customer code, e.g., LAV000001
        $latestCustomer = Customer::orderBy('id', 'desc')->first();
        $sequence = $latestCustomer ? $latestCustomer->id + 1 : 1;
        $customerCode = 'LAV' . str_pad($sequence, 6, '0', STR_PAD_LEFT);

        $customer = Customer::create([
            'customer_code' => $customerCode,
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'gender' => $request->gender,
            'birth_date' => $request->birth_date,
        ]);

        // Initialize loyalty account
        LoyaltyAccount::create([
            'customer_id' => $customer->id,
            'current_stamp' => 0,
            'total_stamp' => 0,
            'total_reward_claim' => 0,
        ]);

        return response()->json([
            'message' => 'Pelanggan berhasil didaftarkan.',
            'customer' => $customer->load('loyaltyAccount')
        ], 210); // 210 Created custom code or 201 standard
    }

    public function show($id)
    {
        $customer = Customer::with(['loyaltyAccount.transactions.order', 'orders.items.service'])->find($id);

        if (!$customer) {
            return response()->json(['message' => 'Pelanggan tidak ditemukan.'], 404);
        }

        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json(['message' => 'Pelanggan tidak ditemukan.'], 404);
        }

        $request->validate([
            'full_name' => 'required|string|max:100',
            'phone' => 'required|string|max:20|unique:customers,phone,' . $customer->id,
            'email' => 'nullable|email|max:100',
            'gender' => 'nullable|in:L,P',
            'birth_date' => 'nullable|date',
        ]);

        $customer->update([
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'gender' => $request->gender,
            'birth_date' => $request->birth_date,
        ]);

        return response()->json([
            'message' => 'Data pelanggan berhasil diperbarui.',
            'customer' => $customer->load('loyaltyAccount')
        ]);
    }
}
