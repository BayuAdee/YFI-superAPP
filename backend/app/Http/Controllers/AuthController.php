<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $r)
    {
        $u = User::where('nik', trim((string) $r->input('nik')))->first();
        abort_unless($u && Hash::check((string) $r->input('password'), $u->password), 422, 'NIK atau password salah.');
        abort_unless($u->active, 422, 'Akun dinonaktifkan. Hubungi superadmin.');

        return ['token' => $u->createToken('web')->plainTextToken];
    }

    public function me(Request $r)
    {
        return $r->user()->only('nik', 'name', 'dept', 'role');
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
