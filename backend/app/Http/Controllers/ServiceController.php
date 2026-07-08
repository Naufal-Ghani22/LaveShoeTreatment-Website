<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::query();

        if ($request->has('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'estimated_days' => 'required|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $service = Service::create([
            'service_name' => $request->service_name,
            'price' => $request->price,
            'estimated_days' => $request->estimated_days,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Layanan baru berhasil ditambahkan.',
            'service' => $service
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $service = Service::find($id);

        if (!$service) {
            return response()->json(['message' => 'Layanan tidak ditemukan.'], 404);
        }

        $request->validate([
            'service_name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'estimated_days' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'required|boolean',
        ]);

        $service->update([
            'service_name' => $request->service_name,
            'price' => $request->price,
            'estimated_days' => $request->estimated_days,
            'description' => $request->description,
            'is_active' => $request->is_active,
        ]);

        return response()->json([
            'message' => 'Layanan berhasil diperbarui.',
            'service' => $service
        ]);
    }
}
