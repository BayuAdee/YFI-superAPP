<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Akun Superapps: login dengan NIK (tanpa email). Aturan isian dijaga CHECK di database.
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("create table users (
            id bigserial primary key,
            nik text not null unique check (nik <> '' and nik = btrim(nik)),
            name text not null check (btrim(name) <> ''),
            dept text,
            role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
            active boolean not null default true,
            password text not null,
            created_at timestamp,
            updated_at timestamp
        )");

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('sessions');
    }
};
