<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SsoTest extends TestCase
{
    use RefreshDatabase;

    const KUNCI = 'kunci-uji-minimal-32-karakter-xxxxxxxx';

    protected function setUp(): void
    {
        parent::setUp();
        config(['sistem.safety.secret' => self::KUNCI, 'sistem.safety.url' => 'http://sp.test/']);
    }

    private function akun(string $nik, bool $akses): User
    {
        $u = User::create(['nik' => $nik, 'name' => "Akun $nik", 'password' => 'x']);
        $akses && DB::table('akses')->insert(['nik' => $nik, 'sistem' => 'safety']);

        return $u->fresh();
    }

    public function test_tiket_bisa_diverifikasi_penerima(): void
    {
        $this->actingAs($this->akun('90011', true));
        $this->getJson('/api/sistem')->assertExactJson([['kode' => 'safety', 'nama' => 'Safety Patrol & 5S/5R', 'ket' => config('sistem.safety.ket')]]);

        $url = $this->postJson('/api/sso/safety')->assertOk()->json('url');
        $this->assertStringStartsWith('http://sp.test/sso#tiket=', $url);

        // Langkah verifikasi persis seperti SsoTicket::nik() di Safety Patrol.
        [$b, $sig] = explode('.', substr($url, strlen('http://sp.test/sso#tiket=')), 2);
        $this->assertTrue(hash_equals(hash_hmac('sha256', $b, self::KUNCI), $sig));
        $this->assertStringNotContainsString('=', $b);
        [$nik, $exp] = explode('|', base64_decode(strtr($b, '-_', '+/')), 2);
        $this->assertSame('90011', $nik);
        $this->assertEqualsWithDelta(time() + 60, (int) $exp, 2);
    }

    public function test_tanpa_akses_ditolak(): void
    {
        $this->actingAs($this->akun('90012', false));
        $this->getJson('/api/sistem')->assertExactJson([]);
        $this->postJson('/api/sso/safety')->assertForbidden();
        $this->postJson('/api/sso/tidakada')->assertForbidden();
        $this->postJson('/api/sso/safety.secret')->assertForbidden();
    }

    public function test_akun_nonaktif_dan_kunci_kosong(): void
    {
        $u = $this->akun('90021', true);
        $this->actingAs($u);

        config(['sistem.safety.secret' => 'pendek']);
        $this->postJson('/api/sso/safety')->assertStatus(503);

        config(['sistem.safety.secret' => self::KUNCI]);
        $u->update(['active' => false]);
        $this->postJson('/api/sso/safety')->assertForbidden();
    }

    public function test_ganti_nik_akses_ikut(): void
    {
        $u = $this->akun('90031', true);
        $u->update(['nik' => '12345']);
        $this->assertSame(['12345'], DB::table('akses')->pluck('nik')->all());
    }
}
