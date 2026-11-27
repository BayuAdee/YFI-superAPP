import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { login } from '../api'
import logo from '../logo.jpg'
import { BTN, INPUT, PasswordInput } from '../ui'

// Desktop: panel hitam bermotif (identitas, sama dengan kartu sambutan Safety Patrol) + form. HP: form saja.
export default function Login({ onLogin }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const f = new FormData(e.target)
    try {
      await login(f.get('nik'), f.get('password'))
      onLogin()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gray-950 p-10 text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(-45deg,#fff_0_14px,transparent_14px_32px)] [mask-image:linear-gradient(to_top_right,transparent,#000)]" />
        <div className="relative flex items-center gap-3">
          <img src={logo} alt="" className="h-11 w-11 rounded-full bg-white ring-2 ring-white/20" />
          <span className="leading-tight"><span className="block font-bold tracking-wide">SUPERAPPS</span><span className="block text-sm text-gray-400">PT Yahata Fastener Indonesia</span></span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Satu pintu untuk semua sistem internal YFI.</h2>
          <p className="mt-4 text-gray-400">Login sekali dengan NIK, lalu masuk ke Safety Patrol dan sistem lain tanpa login ulang.</p>
        </div>
        <p className="relative text-xs text-gray-500">© {new Date().getFullYear()} PT Yahata Fastener Indonesia · Penggunaan internal</p>
      </section>

      <div className="flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-full max-w-sm animate-muncul">
          <div className="mb-6 flex flex-col items-center text-center lg:items-start lg:text-left">
            <img src={logo} alt="Logo PT Yahata Fastener Indonesia" className="mb-3 h-16 w-16 rounded-full lg:hidden" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Masuk ke Superapps</h1>
            <p className="text-sm text-gray-500">Gunakan NIK dan password Anda.</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700">
              NIK
              <input name="nik" inputMode="numeric" autoComplete="username" spellCheck={false} required className={INPUT} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <PasswordInput name="password" autoComplete="current-password" required />
            </label>
            {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button disabled={busy} className={`${BTN} w-full py-3`}><LogIn size={16} aria-hidden="true" /> {busy ? 'Memproses...' : 'Masuk'}</button>
            <p className="text-center text-xs text-gray-500">Lupa password? Hubungi superadmin.</p>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 lg:hidden">© {new Date().getFullYear()} PT Yahata Fastener Indonesia · Penggunaan internal</p>
      </div>
    </div>
  )
}
