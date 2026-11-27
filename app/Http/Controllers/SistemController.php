<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SistemController extends Controller
{
    // Card di Beranda: hanya sistem yang dicentang untuk akun ini.
    public function index(Request $r)
    {
        $kode = DB::table('akses')->where('nik', $r->user()->nik)->pluck('sistem')->all();

        return collect(config('sistem'))->only($kode)
            ->map(fn ($s, $k) => ['kode' => $k, 'nama' => $s['nama'], 'ket' => $s['ket']])->values();
    }

    // Tiket SSO dibuat di server (kunci rahasia tidak pernah sampai ke browser). Format HARUS sama dengan
    // systeminformasisafetypatrol/backend/app/SsoTicket.php: B . "." . hex(HMAC-SHA256(B, kunci)), B = base64url("nik|exp").
    public function sso(Request $r, string $kode)
    {
        $u = $r->user();
        $s = config('sistem')[$kode] ?? null;
        abort_unless($s && $u->active && DB::table('akses')->where(['nik' => $u->nik, 'sistem' => $kode])->exists(),
            403, 'Anda tidak punya akses ke sistem ini.');
        abort_if(strlen((string) $s['secret']) < 32, 503, 'SSO sistem ini belum dikonfigurasi. Hubungi superadmin.');

        $b = rtrim(strtr(base64_encode($u->nik.'|'.(time() + 60)), '+/', '-_'), '=');

        // Tiket setelah "#": tidak terkirim ke server tujuan dan tidak tercatat di log.
        return ['url' => rtrim($s['url'], '/').'/sso#tiket='.$b.'.'.hash_hmac('sha256', $b, $s['secret'])];
    }
}
