<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Akun awal. Aman dijalankan berulang: php artisan db:seed
// NIK HARUS sama dengan seeder tiap sistem (SSO mencocokkan NIK): 900 + nomor departemen + 1/2.
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_PASSWORD') ?: throw new \RuntimeException('Isi SEED_PASSWORD di .env (password awal semua akun).');

        $akun = [['90000', 'Superadmin', null, 'superadmin'], ['90100', 'Admin', null, 'admin']];
        $depts = ['Engineering', 'HRGA', 'Maintenance', 'PPIC', 'Produksi', 'Purchasing', 'Quality', 'Sales & Marketing'];
        foreach ($depts as $i => $d) {
            foreach ([1, 2] as $n) {
                $akun[] = ['900'.($i + 1).$n, "$d $n", $d, 'user'];
            }
        }
        foreach ($akun as [$nik, $name, $dept, $role]) {
            User::updateOrCreate(['nik' => $nik], ['name' => $name, 'dept' => $dept, 'role' => $role, 'password' => $password]);
        }

        // ponytail: akun uji dicentang ke Safety Patrol agar SSO bisa langsung dicoba. Centang asli lewat menu Kelola.
        DB::table('akses')->insertOrIgnore(array_map(fn ($a) => ['nik' => $a[0], 'sistem' => 'safety'], $akun));
    }
}
