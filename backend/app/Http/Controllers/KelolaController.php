<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Kelola akun dan akses sistem. Hanya superadmin (routes/api.php: can:superadmin).
// NIK ganda, nama kosong, peran salah: ditolak database (pesan di bootstrap/app.php).
class KelolaController extends Controller
{
    // Semua akun + sistem yang dicentang untuk masing-masing, dan daftar sistem untuk kolom centang.
    public function index()
    {
        $akses = DB::table('akses')->get()->groupBy('nik');

        return [
            'users' => DB::table('users')->orderByRaw('dept nulls first, nik')->get(['id', 'nik', 'name', 'dept', 'role', 'active'])
                ->map(fn ($u) => [...(array) $u, 'akses' => $akses->get($u->nik)?->pluck('sistem') ?? []]),
            'sistem' => collect(config('sistem'))->map(fn ($s, $k) => ['kode' => $k, 'nama' => $s['nama']])->values(),
        ];
    }

    public function store(Request $r)
    {
        $this->password($r, true);
        User::create($r->only(['nik', 'name', 'dept', 'role', 'password']));

        return response()->noContent();
    }

    // Ubah sebagian: hanya isian yang dikirim. Kirim password = reset password.
    public function update(Request $r, User $user)
    {
        $this->password($r, false);
        abort_if($user->is($r->user()) && $r->hasAny(['role', 'active']), 422, 'Peran dan status akun sendiri tidak bisa diubah.');
        $user->update($r->only(['nik', 'name', 'dept', 'role', 'active', 'password']));
        if (! $user->active || $r->has('password')) {
            $user->tokens()->delete();   // nonaktif / password direset: sesi yang sedang berjalan ikut putus
        }

        return response()->noContent();
    }

    // Akses ikut terhapus (foreign key on delete cascade). Karyawan keluar cukup dinonaktifkan.
    public function destroy(Request $r, User $user)
    {
        abort_if($user->is($r->user()), 422, 'Akun sendiri tidak bisa dihapus.');
        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->noContent();
    }

    // Centang/hapus centang satu sistem untuk satu atau banyak NIK sekaligus (mis. satu departemen).
    public function akses(Request $r)
    {
        $r->validate(['nik' => 'required|array', 'nik.*' => 'string', 'on' => 'required|boolean']);
        $kode = (string) $r->input('sistem');
        abort_unless(array_key_exists($kode, config('sistem')), 422, 'Sistem tidak dikenal.');

        $r->boolean('on')
            ? DB::table('akses')->insertOrIgnore(array_map(fn ($n) => ['nik' => $n, 'sistem' => $kode], $r->nik))
            : DB::table('akses')->where('sistem', $kode)->whereIn('nik', $r->nik)->delete();

        return response()->noContent();
    }

    private function password(Request $r, bool $new): void
    {
        abort_if(($new || $r->has('password')) && mb_strlen((string) $r->password) < 8, 422, 'Password minimal 8 karakter.');
    }
}
