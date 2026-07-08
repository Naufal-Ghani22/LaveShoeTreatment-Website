<?php

namespace App\Http\Controllers;

use App\Models\Cashflow;
use App\Models\Customer;
use App\Models\FinancialCategory;
use App\Models\Income;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\Service;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'branch', 'items.service', 'items.photos']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('full_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        return response()->json($query->orderBy('id', 'desc')->paginate(15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'pickup_method' => 'required|in:Drop-off,Delivery,Pickup-Delivery',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.shoe_brand' => 'required|string|max:50',
            'items.*.shoe_type' => 'required|string|max:50',
            'items.*.shoe_color' => 'nullable|string|max:30',
            'items.*.qty' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($request) {
            // Generate Order Number: LAV/[YYYYMMDD]/[SEQUENCE]
            $datePrefix = date('Ymd');
            $latestOrder = Order::where('order_number', 'like', "LAV/{$datePrefix}/%")->orderBy('id', 'desc')->first();
            $sequence = 1;
            if ($latestOrder) {
                $parts = explode('/', $latestOrder->order_number);
                $sequence = (int)end($parts) + 1;
            }
            $orderNumber = "LAV/{$datePrefix}/" . str_pad($sequence, 4, '0', STR_PAD_LEFT);

            $subtotal = 0.00;
            $itemsData = [];

            foreach ($request->items as $index => $item) {
                $service = Service::find($item['service_id']);
                $price = $service->price;
                $qty = $item['qty'];
                $itemSubtotal = $price * $qty;
                $subtotal += $itemSubtotal;

                $itemsData[] = [
                    'service_id' => $item['service_id'],
                    'shoe_brand' => $item['shoe_brand'],
                    'shoe_type' => $item['shoe_type'],
                    'shoe_color' => $item['shoe_color'] ?? null,
                    'qty' => $qty,
                    'price' => $price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $discount = $request->discount ?? 0.00;
            $totalPrice = max(0.00, $subtotal - $discount);

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $request->customer_id,
                'branch_id' => $request->branch_id,
                'order_date' => now(),
                'pickup_method' => $request->pickup_method,
                'status' => 'Pending',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total_price' => $totalPrice,
                'notes' => $request->notes,
            ]);

            foreach ($itemsData as $index => $itemData) {
                $orderItem = $order->items()->create($itemData);
                
                // Handle multiple files for photos_before (Up to 4 images)
                $fileKey = "items.{$index}.photos_before";
                if ($request->hasFile($fileKey)) {
                    $files = $request->file($fileKey);
                    // Slice to enforce maximum of 4 photos
                    $files = is_array($files) ? array_slice($files, 0, 4) : [$files];
                    foreach ($files as $file) {
                        $uploadResult = CloudinaryService::upload($file, 'lave_shoes_before');
                        $orderItem->photos()->create([
                            'photo_type' => 'Before',
                            'photo_url' => $uploadResult['url'],
                            'cloudinary_public_id' => $uploadResult['public_id'],
                        ]);
                    }
                }
            }

            // Increment customer total orders count
            $customer = Customer::find($request->customer_id);
            $customer->increment('total_orders');

            return response()->json([
                'message' => 'Pesanan berhasil dibuat.',
                'order' => $order->load('items.service', 'items.photos')
            ], 201);
        });
    }

    public function show($id)
    {
        $order = Order::with(['customer.loyaltyAccount', 'branch', 'items.service', 'items.photos', 'paymentTransaction'])->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Pending,Received,Washing,Drying,Finishing,Ready,Completed,Cancelled',
            'notes' => 'nullable|string',
        ]);

        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $order->update(['status' => $request->status]);

        // Upload multiple photo_after when state transitions to Ready / Completed
        if ($request->status === 'Ready' || $request->status === 'Completed') {
            foreach ($order->items as $index => $item) {
                $fileKey = "items.{$index}.photos_after";
                if ($request->hasFile($fileKey)) {
                    $files = $request->file($fileKey);
                    // Slice to enforce maximum of 4 photos
                    $files = is_array($files) ? array_slice($files, 0, 4) : [$files];
                    
                    // Clear previous After photos if any to prevent cluttering
                    $item->photos()->where('photo_type', 'After')->delete();

                    foreach ($files as $file) {
                        $uploadResult = CloudinaryService::upload($file, 'lave_shoes_after');
                        $item->photos()->create([
                            'photo_type' => 'After',
                            'photo_url' => $uploadResult['url'],
                            'cloudinary_public_id' => $uploadResult['public_id'],
                        ]);
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui.',
            'order' => $order->load('items.service', 'items.photos')
        ]);
    }

    public function recordPayment(Request $request, $id)
    {
        $request->validate([
            'payment_method' => 'required|in:Cash,QRIS,Transfer,E-Wallet',
            'paid_amount' => 'required|numeric|min:0',
            'reference_number' => 'nullable|string|max:50',
        ]);

        $order = Order::with('customer.loyaltyAccount')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $existingPayment = PaymentTransaction::where('order_id', $order->id)->where('payment_status', 'Paid')->first();
        if ($existingPayment) {
            return response()->json(['message' => 'Pesanan ini sudah lunas.'], 400);
        }

        return DB::transaction(function () use ($request, $order) {
            $payment = PaymentTransaction::create([
                'order_id' => $order->id,
                'payment_method' => $request->payment_method,
                'payment_status' => 'Paid',
                'paid_amount' => $request->paid_amount,
                'payment_date' => now(),
                'reference_number' => $request->reference_number,
            ]);

            if ($order->status === 'Pending') {
                $order->update(['status' => 'Received']);
            }

            $customer = $order->customer;
            $customer->increment('total_spent', $request->paid_amount);

            $stampsEarned = floor($request->paid_amount / 25000);
            if ($stampsEarned > 0) {
                $loyalty = $customer->loyaltyAccount;
                if ($loyalty) {
                    $loyalty->increment('current_stamp', $stampsEarned);
                    $loyalty->increment('total_stamp', $stampsEarned);

                    LoyaltyTransaction::create([
                        'loyalty_account_id' => $loyalty->id,
                        'order_id' => $order->id,
                        'transaction_type' => 'Earn',
                        'stamp' => $stampsEarned,
                        'description' => "Mendapatkan {$stampsEarned} stamp dari pembayaran nota {$order->order_number}.",
                    ]);
                }
            }

            $incomeCategory = FinancialCategory::where('category_name', 'Pendapatan Jasa Cuci')->first();
            $categoryId = $incomeCategory ? $incomeCategory->id : 1;

            $income = Income::create([
                'financial_category_id' => $categoryId,
                'order_id' => $order->id,
                'branch_id' => $order->branch_id,
                'amount' => $request->paid_amount,
                'income_date' => date('Y-m-d'),
                'description' => "Pemasukan pembayaran order {$order->order_number}",
            ]);

            $latestCashflow = Cashflow::where('branch_id', $order->branch_id)->orderBy('id', 'desc')->first();
            $newBalance = ($latestCashflow ? $latestCashflow->current_balance : 0.00) + $request->paid_amount;

            Cashflow::create([
                'branch_id' => $order->branch_id,
                'transaction_type' => 'In',
                'amount' => $request->paid_amount,
                'reference_table' => 'incomes',
                'reference_id' => $income->id,
                'transaction_date' => date('Y-m-d'),
                'current_balance' => $newBalance,
            ]);

            return response()->json([
                'message' => 'Pembayaran berhasil dicatat. Poin loyalty dan kasir keuangan telah diperbarui secara otomatis.',
                'payment' => $payment,
                'loyalty_stamps_earned' => $stampsEarned,
                'current_balance' => $newBalance
            ]);
        });
    }

    public function generateWaTemplate($id, Request $request)
    {
        $order = Order::with('customer')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $type = $request->query('type', 'completed');
        $phone = preg_replace('/[^0-9]/', '', $order->customer->phone);
        
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        if ($type === 'completed') {
            $message = "Halo {$order->customer->full_name}, sepatu Anda di Lave Shoe Treatment dengan nomor order *{$order->order_number}* sudah selesai diproses dan siap diambil. Terima kasih!";
        } else {
            $message = "Halo {$order->customer->full_name}, ini adalah pengingat dari Lave Shoe Treatment bahwa sepatu Anda dengan nomor order *{$order->order_number}* sudah siap diambil. Silakan berkunjung ke outlet kami. Terima kasih!";
        }

        $waLink = "https://wa.me/{$phone}?text=" . urlencode($message);

        return response()->json([
            'wa_link' => $waLink,
            'message_preview' => $message
        ]);
    }

    public function trackPublic(Request $request)
    {
        $request->validate([
            'order_number' => 'required|string',
        ]);

        $order = Order::with(['customer.loyaltyAccount', 'items.service', 'items.photos'])
            ->where('order_number', $request->input('order_number'))
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        return response()->json($order);
    }
}
