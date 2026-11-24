<?php

// Daftar sistem yang bisa dimasuki lewat SSO. Menambah sistem = tambah baris di sini + kunci baru di .env
// (kunci yang sama dipasang di .env sistem tujuan sebagai SSO_SECRET). Kode = nilai kolom akses.sistem.
return [
    'safety' => [
        'nama' => 'Safety Patrol & 5S/5R',
        'ket' => 'Lapor temuan safety dan 5S, tugas perbaikan, rekap.',
        'url' => env('URL_SAFETY', 'http://localhost:5173'),
        'secret' => env('SSO_SECRET_SAFETY'),
    ],
];
