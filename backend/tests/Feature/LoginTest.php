<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_nik(): void
    {
        User::create(['nik' => '90011', 'name' => 'Engineering 1', 'dept' => 'Engineering', 'password' => 'rahasia']);

        $token = $this->postJson('/api/login', ['nik' => '90011', 'password' => 'rahasia'])->assertOk()->json('token');
        $this->withToken($token)->getJson('/api/me')->assertExactJson(['nik' => '90011', 'name' => 'Engineering 1', 'dept' => 'Engineering', 'role' => 'user']);

        $this->postJson('/api/login', ['nik' => '90011', 'password' => 'salah'])->assertStatus(422);
        $this->postJson('/api/login', ['nik' => '99999', 'password' => 'rahasia'])->assertStatus(422);

        User::where('nik', '90011')->update(['active' => false]);
        $this->postJson('/api/login', ['nik' => '90011', 'password' => 'rahasia'])->assertStatus(422)->assertJson(['message' => 'Akun dinonaktifkan. Hubungi superadmin.']);
    }

    public function test_tanpa_token_ditolak(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }
}
