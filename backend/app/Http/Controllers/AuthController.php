<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::with(['role', 'employee.branch'])->where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password yang Anda masukkan salah.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Akun Anda dinonaktifkan oleh administrator.'
            ], 403);
        }

        $user->update(['last_login' => now()]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role->role_name,
                'employee' => $user->employee ? [
                    'name' => $user->employee->name,
                    'branch' => $user->employee->branch ? $user->employee->branch->branch_name : null,
                ] : null,
            ]
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['role', 'employee.branch']);
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role->role_name,
            'employee' => $user->employee ? [
                'name' => $user->employee->name,
                'branch' => $user->employee->branch ? $user->employee->branch->branch_name : null,
            ] : null,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Berhasil keluar dari sistem.'
        ]);
    }
}
