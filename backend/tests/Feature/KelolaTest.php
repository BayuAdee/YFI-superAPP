<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class KelolaTest extends TestCase
{
    use RefreshDatabase;

    private User $sa;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sa = User::create(['nik' => '90000', 'name' => 'Superadmin', 'role' => 'superadmin', 'password' => 'rahasia123'])->fresh();
    }

    public function test_hanya_superadmin(): void
    {
        foreach (['user', 'admin'] as $role) {
            $this->actingAs(User::create(['nik' => "1$role", 'name' => $role, 'role' => $role, 'password' => 'x'])->fresh());
            $this->getJson('/api/users')->assertForbidden();
            $this->putJson('/api/akses', ['sistem' => 'safety', 'nik' => ['90000'], 'on' => true])->assertForbidden();
        }
    }

    public function test_tambah_ubah_hapus_akun(): void
    {
        $this->actingAs($this->sa);
        $this->postJson('/api/users', ['nik' => '1001', 'name' => 'Budi', 'dept' => 'Produksi', 'role' => 'user', 'password' => 'pendek'])
            ->assertStatus(422)->assertJson(['message' => 'Password minimal 8 karakter.']);
        $this->postJson('/api/users', ['nik' => '1001', 'name' => 'Budi', 'dept' => 'Produksi', 'role' => 'user', 'password' => 'password1'])->assertNoContent();
        $budi = User::where('nik', '1001')->first();
        $this->patchJson("/api/users/$budi->id", ['nik' => '2001', 'dept' => ''])->assertNoContent();
        $this->assertSame(['2001', null], [$budi->fresh()->nik, $budi->fresh()->dept]);

        $u = collect($this->getJson('/api/users')->assertOk()->json('users'))->firstWhere('nik', '2001');
        $this->assertSame(['Budi', []], [$u['name'], $u['akses']]);

        $this->deleteJson("/api/users/$budi->id")->assertNoContent();
        $this->assertNull($budi->fresh());

        // Tolakan database membatalkan transaksi uji: harus jadi request terakhir dalam satu tes.
        $this->postJson('/api/users', ['nik' => '90000', 'name' => 'Lain', 'role' => 'user', 'password' => 'password1'])
            ->assertStatus(422)->assertJson(['message' => 'NIK sudah dipakai akun lain.']);
    }

    public function test_peran_salah_ditolak_database(): void
    {
        $this->actingAs($this->sa);
        $this->postJson('/api/users', ['nik' => '1002', 'name' => 'X', 'role' => 'raja', 'password' => 'password1'])->assertStatus(422);
    }

    public function test_nonaktif_dan_reset_password_memutus_sesi(): void
    {
        $this->actingAs($this->sa);
        $u = User::create(['nik' => '1001', 'name' => 'Budi', 'password' => 'password1']);

        $u->createToken('web');
        $this->patchJson("/api/users/$u->id", ['password' => 'password2'])->assertNoContent();
        $this->assertSame(0, $u->tokens()->count());
        $this->postJson('/api/login', ['nik' => '1001', 'password' => 'password2'])->assertOk();

        $this->patchJson("/api/users/$u->id", ['active' => false])->assertNoContent();
        $this->assertSame(0, $u->tokens()->count());
    }

    public function test_pengaman_akun_sendiri(): void
    {
        $this->actingAs($this->sa);
        $this->patchJson("/api/users/{$this->sa->id}", ['role' => 'user'])->assertStatus(422);
        $this->patchJson("/api/users/{$this->sa->id}", ['active' => false])->assertStatus(422);
        $this->deleteJson("/api/users/{$this->sa->id}")->assertStatus(422);
        $this->patchJson("/api/users/{$this->sa->id}", ['name' => 'Super'])->assertNoContent();
    }

    public function test_centang_akses_massal(): void
    {
        $this->actingAs($this->sa);
        foreach (['1001', '1002'] as $nik) {
            User::create(['nik' => $nik, 'name' => "A$nik", 'dept' => 'Produksi', 'password' => 'x']);
        }
        $semua = ['sistem' => 'safety', 'nik' => ['1001', '1002']];

        $this->putJson('/api/akses', [...$semua, 'on' => true])->assertNoContent();
        $this->putJson('/api/akses', [...$semua, 'on' => true])->assertNoContent();   // ulang: tidak ganda
        $this->assertSame(2, DB::table('akses')->count());

        $this->putJson('/api/akses', ['sistem' => 'safety', 'nik' => ['1001'], 'on' => false])->assertNoContent();
        $this->assertSame(['1002'], DB::table('akses')->pluck('nik')->all());

        $this->putJson('/api/akses', ['sistem' => 'tidakada', 'nik' => ['1001'], 'on' => true])->assertStatus(422);
        $this->putJson('/api/akses', ['sistem' => 'safety', 'nik' => ['9999'], 'on' => true])->assertStatus(422);
    }
}
