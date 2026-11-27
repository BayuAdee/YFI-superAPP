<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Akses per orang: baris (nik, sistem) = orang itu boleh masuk sistem itu. Kode sistem dari config/sistem.php.
// NIK diganti di menu Kelola -> akses ikut (on update cascade). Akun dihapus -> aksesnya ikut terhapus.
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("create table akses (
            nik text not null references users(nik) on update cascade on delete cascade,
            sistem text not null check (sistem <> ''),
            primary key (nik, sistem)
        )");
    }

    public function down(): void
    {
        DB::statement('drop table if exists akses');
    }
};
