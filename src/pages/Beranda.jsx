import { useEffect, useState } from 'react'
import { ArrowRight, Cog, Info, LayoutGrid, Loader2, ShieldCheck, Wrench } from 'lucide-react'
import { api } from '../api'
import { Skeleton } from '../ui'

// Ikon card per kode sistem (config/sistem.php). Sistem baru tanpa ikon memakai LayoutGrid.
const ICON = { safety: ShieldCheck, mesin: Cog, tooling: Wrench }
const ROLE = { user: 'User', admin: 'Admin (monitor office)', superadmin: 'Superadmin' }

// Card = sistem yang dicentang untuk akun ini. Klik -> server membuat tiket SSO -> browser pindah ke sistem itu.
export default function Beranda({ profile }) {
  const [sistem, setSistem] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { api('/sistem').then(setSistem, (e) => { setSistem([]); setError(e.message) }) }, [])

  async function masuk(kode) {
    setBusy(kode)
    setError('')
    try {
      location.href = (await api(`/sso/${kode}`, { method: 'POST' })).url
    } catch (e) {
      setError(e.message)
      setBusy('')
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <section className="relative overflow-hidden rounded-xl bg-gray-950 p-5 text-white shadow-sm sm:p-6">
        {/* Garis diagonal tipis = motif rambu K3, sama dengan Safety Patrol. Dekoratif saja. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.07] [background:repeating-linear-gradient(-45deg,#fff_0_12px,transparent_12px_28px)] [mask-image:linear-gradient(to_left,#000,transparent)]" />
        <div className="relative">
          <p className="text-sm text-gray-400">Selamat datang,</p>
          <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
          <p className="mt-1 text-sm text-gray-300">{profile.dept ?? 'Tanpa departemen'} · {ROLE[profile.role]} · NIK {profile.nik}</p>
        </div>
      </section>

      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-950">Sistem Anda</h2>
          <p className="text-sm text-gray-500">Pilih sistem untuk masuk tanpa login ulang.</p>
        </div>
        {sistem?.length > 0 && <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-gray-700">{sistem.length} sistem</span>}
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      {sistem === null ? <Skeleton n={3} h="h-36" />
        : !sistem.length ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"><Info size={24} aria-hidden="true" /></span>
            <p className="font-semibold text-gray-900">Belum ada sistem untuk akun Anda</p>
            <p className="text-sm text-gray-500">Hubungi superadmin untuk membuka akses.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {sistem.map((s) => {
              const Icon = ICON[s.kode] ?? LayoutGrid
              return (
                <button key={s.kode} onClick={() => masuk(s.kode)} disabled={!!busy}
                  className="group flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 text-left shadow-xs transition hover:border-gray-900 hover:shadow-md enabled:active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
                  <span className="flex items-start justify-between gap-3">
                    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-950 text-white"><Icon size={24} /></span>
                    {busy === s.kode
                      ? <Loader2 size={20} className="animate-spin text-gray-900" aria-hidden="true" />
                      : <ArrowRight size={20} className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-900" aria-hidden="true" />}
                  </span>
                  <span>
                    <span className="block text-base font-bold text-gray-950">{s.nama}</span>
                    <span className="mt-1 block text-sm text-gray-500">{busy === s.kode ? 'Membuka sistem...' : s.ket}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
    </div>
  )
}
