import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Token gaya bersama, sama dengan Safety Patrol (web internal: datar, garis tipis, sudut kecil). Input 16px di HP agar iOS tidak zoom.
export const INPUT = 'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base font-normal text-gray-900 shadow-xs outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 sm:text-sm'
export const CARD = 'flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-xs sm:p-5'
export const CARD_TITLE = 'border-b border-gray-200 pb-3 text-base font-semibold text-gray-900'
export const BTN = 'inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition enabled:active:scale-[0.98] hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50'
export const BTN2 = 'inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition enabled:active:scale-[0.98] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

// Kerangka abu selama data dimuat; tinggi mirip isi asli agar layar tidak melompat.
export function Skeleton({ n = 3, h = 'h-28', className = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Memuat...</span>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} aria-hidden="true" className={`${h} animate-pulse rounded-lg border border-gray-200 bg-white p-4`}>
          <div className="h-3 w-1/3 rounded bg-gray-200" /><div className="mt-3 h-3 w-2/3 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export function PasswordInput({ className = INPUT, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={`${className} pr-11`} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan password' : 'Lihat password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-900">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

// Popup kartu pengganti window.confirm/prompt, pakai <dialog> bawaan browser (latar gelap, Esc, fokus). Sama dengan Safety Patrol.
// const [dialog, el] = useDialog(); render {el}; await dialog({ title, text?, input?, type?, minLength?, list?, ok?, danger? })
// Hasil: konfirmasi = true, isian = teks, Batal/Esc = null. list = id <datalist> untuk saran isian.
export function useDialog() {
  const [d, setD] = useState(null)
  const ref = useRef(null)
  useEffect(() => { if (d) ref.current.showModal() }, [d])
  const close = (v) => { ref.current.close(); d.resolve(v); setD(null) }
  const DialogField = d?.type === 'password' ? PasswordInput : 'input'
  const el = d && (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); close(null) }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg bg-transparent p-0 backdrop:bg-gray-900/60">
      <form className={`${CARD} animate-muncul border-0 shadow-xl`} onSubmit={(e) => { e.preventDefault(); close(d.input === undefined ? true : e.currentTarget.v.value.trim() || null) }}>
        <h3 className="text-base font-semibold text-gray-900">{d.title}</h3>
        {d.text && <p className="text-sm text-gray-600">{d.text}</p>}
        {d.input !== undefined && <DialogField name="v" defaultValue={d.input} type={d.type ?? 'text'} minLength={d.minLength} list={d.list} required autoFocus autoComplete="off" className={INPUT} />}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => close(null)} className={BTN2}>Batal</button>
          <button className={d.danger ? BTN.replace('bg-gray-900', 'bg-red-600').replace('hover:bg-gray-700', 'hover:bg-red-700') : BTN}>{d.ok ?? 'Simpan'}</button>
        </div>
      </form>
    </dialog>
  )
  return [(opts) => new Promise((resolve) => setD({ ...opts, resolve })), el]
}
