import { useEffect, useRef, useState } from 'react'
import { Home, LogOut, Users } from 'lucide-react'
import { api, hasToken, logout } from './api'
import Beranda from './pages/Beranda'
import Kelola from './pages/Kelola'
import Login from './pages/Login'

const TITLE = { HOME: 'Beranda', KELOLA: 'Kelola Akun & Akses' }
const ROLE = { user: 'User', admin: 'Admin', superadmin: 'Superadmin' }

// Kerangka sama dengan Safety Patrol: sidebar hitam (desktop), bar atas hitam + menu bawah (HP).
// Layar dicatat di riwayat browser agar tombol Back HP kembali ke layar sebelumnya.
export default function App() {
  const [profile, setProfile] = useState(undefined) // undefined = memuat, null = belum login
  const [view, setView] = useState('HOME') // HOME, KELOLA (superadmin)
  const heading = useRef(null)
  const shown = useRef('HOME')
  const load = () => (hasToken() ? api('/me').then(setProfile, () => setProfile(null)) : setProfile(null))
  useEffect(() => { load() }, [])

  useEffect(() => {
    history.replaceState({ v: 'HOME' }, '')
    const onBack = (e) => setView(e.state?.v ?? 'HOME')
    addEventListener('popstate', onBack)
    return () => removeEventListener('popstate', onBack)
  }, [])

  // Layar baru: mulai dari atas, fokus ke judul. Tidak saat halaman pertama dibuka.
  useEffect(() => {
    if (shown.current === view) return
    shown.current = view
    scrollTo(0, 0)
    heading.current?.focus()
  }, [view])

  if (profile === undefined) return <p className="mt-24 text-center text-sm text-gray-500">Memuat...</p>
  if (!profile) return <Login onLogin={load} />

  const go = (v) => { if (v !== view) { history.pushState({ v }, ''); setView(v) } }
  const items = [['HOME', 'Beranda', Home], ...(profile.role === 'superadmin' ? [['KELOLA', 'Kelola', Users]] : [])]
  const current = view === 'KELOLA' && profile.role === 'superadmin' ? 'KELOLA' : 'HOME'
  const initials = profile.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const sub = profile.dept ?? ROLE[profile.role]

  return (
    <div className="min-h-dvh">
      {/* Bukan href="#isi": perubahan hash memicu popstate dan mengembalikan ke Beranda. */}
      <a href="#isi" onClick={(e) => { e.preventDefault(); document.getElementById('isi').focus() }}
        className="sr-only rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50">
        Lewati ke isi
      </a>

      {/* ===== Sidebar (desktop) ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gray-950 text-gray-300 lg:flex">
        <button onClick={() => go('HOME')} className="flex items-center gap-3 border-b border-white/10 px-5 py-5 text-left" aria-label="Ke Beranda">
          <img src="/logo.jpg" alt="" className="h-10 w-10 shrink-0 rounded-full bg-white ring-2 ring-white/20" />
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-white">SUPERAPPS</span>
            <span className="block text-xs text-gray-400">PT Yahata Fastener Indonesia</span>
          </span>
        </button>
        <nav aria-label="Menu utama" className="flex flex-1 flex-col gap-1 p-3">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">Menu</p>
          {items.map(([v, , Icon]) => (
            <button key={v} onClick={() => go(v)} aria-current={current === v ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${current === v ? 'bg-white text-gray-950' : 'hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} aria-hidden="true" /> {TITLE[v]}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/20">{initials}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium text-white">{profile.name}</span>
              <span className="block truncate text-xs text-gray-400">{sub} · NIK {profile.nik}</span>
            </span>
          </div>
          <button onClick={logout} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
            <LogOut size={18} aria-hidden="true" /> Keluar
          </button>
        </div>
      </aside>

      <div className={`flex min-h-dvh flex-col lg:pl-64 ${items.length > 1 ? 'pb-20 lg:pb-0' : ''}`}>
        {/* ===== Bar atas (HP & tablet) ===== */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-gray-950 px-4 text-white lg:hidden">
          <button onClick={() => go('HOME')} className="flex min-w-0 items-center gap-3 text-left" aria-label="Ke Beranda">
            <img src="/logo.jpg" alt="" className="h-9 w-9 shrink-0 rounded-full bg-white" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold tracking-wide">SUPERAPPS</span>
              <span className="block truncate text-xs text-gray-400">{profile.name} · {sub}</span>
            </span>
          </button>
          <button onClick={logout} aria-label="Keluar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-300 hover:bg-white/10 hover:text-white">
            <LogOut size={20} />
          </button>
        </header>

        {/* ===== Judul layar ===== */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 lg:px-8 lg:py-5">
            <h1 ref={heading} tabIndex={-1} className="text-xl font-bold tracking-tight text-gray-950 outline-none lg:text-2xl">{TITLE[current]}</h1>
            {current === 'HOME' && <p className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          </div>
        </div>

        <main id="isi" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 p-4 outline-none lg:px-8 lg:py-6">
          <div key={current} className="animate-muncul">
            {current === 'KELOLA' ? <Kelola me={profile} /> : <Beranda profile={profile} />}
          </div>
        </main>

        <footer className="hidden border-t border-gray-200 bg-white px-4 py-4 text-center text-xs text-gray-500 lg:block">
          © {new Date().getFullYear()} PT Yahata Fastener Indonesia · Superapps · Penggunaan internal
        </footer>
      </div>

      {/* ===== Menu bawah (HP), hanya bila menu lebih dari satu (superadmin) ===== */}
      {items.length > 1 && (
        <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-2">
            {items.map(([v, label, Icon]) => (
              <button key={v} onClick={() => go(v)} aria-current={current === v ? 'page' : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${current === v ? 'text-gray-950' : 'text-gray-500 hover:text-gray-900'}`}>
                {current === v && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gray-950" />}
                <Icon size={22} strokeWidth={current === v ? 2.25 : 1.75} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
