import { Fragment, useEffect, useState } from 'react'
import { CheckCircle, ShieldCheck, TriangleAlert, UserPlus } from 'lucide-react'
import { api } from '../api'
import { BTN, CARD, CARD_TITLE, INPUT, PasswordInput, Skeleton, useDialog } from '../ui'

const ROLE = { user: 'User', admin: 'Admin (monitor)', superadmin: 'Superadmin' }
const MINI = 'min-h-8 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-900 hover:bg-gray-50'
const SMALL = 'min-h-8 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs'
const Title = ({ icon: Icon, children }) => <h3 className={`${CARD_TITLE} flex items-center gap-2`}><Icon size={18} aria-hidden="true" />{children}</h3>

// Layar superadmin: akun + centang akses sistem per orang (dikelompokkan per departemen).
// Aturan isian (NIK ganda, peran salah, password < 8) dijaga backend; pesannya tampil di atas.
export default function Kelola({ me }) {
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState(null) // { t, err }
  const [dialog, dialogEl] = useDialog()

  const load = () => api('/users').then(setData, (e) => setMsg({ t: e.message, err: true }))
  useEffect(() => { load() }, [])

  // Semua aksi lewat sini: kirim, tampilkan hasil, muat ulang. true = berhasil.
  const run = (path, body, ok, method = 'POST') => api(path, { body, method })
    .then(() => { setMsg({ t: ok }); load(); return true }, (e) => { setMsg({ t: e.message, err: true }); return false })
  const akses = (sistem, nik, on, ok) => run('/akses', { sistem: sistem.kode, nik, on }, ok, 'PUT')

  async function addUser(e) {
    const form = e.currentTarget
    e.preventDefault()
    const body = Object.fromEntries(new FormData(form))
    if (await run('/users', body, `Akun ${body.name} dibuat.`)) form.reset()
  }

  if (!data) return msg
    ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg.t}</p>
    : <Skeleton n={2} h="h-48" className="flex flex-col gap-4" />
  const { users, sistem } = data
  const depts = [...new Set(users.map((u) => u.dept).filter(Boolean))].sort()

  return (
    <div className="flex flex-col gap-4">
      {dialogEl}
      <datalist id="depts">{depts.map((d) => <option key={d} value={d} />)}</datalist>
      <div role="status" aria-live="polite">{msg && (
        <p className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm font-medium ${msg.err ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-900'}`}>
          {msg.err ? <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}{msg.t}
        </p>)}
      </div>

      <form onSubmit={addUser} className={CARD}>
        <Title icon={UserPlus}>Tambah Akun</Title>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-medium text-gray-700">NIK<input name="nik" required inputMode="numeric" autoComplete="off" className={INPUT} /></label>
          <label className="block text-sm font-medium text-gray-700">Nama<input name="name" required className={INPUT} /></label>
          <label className="block text-sm font-medium text-gray-700">Departemen <span className="font-normal text-gray-500">(kosong untuk Admin/Superadmin)</span>
            <input name="dept" list="depts" autoComplete="off" className={INPUT} />
          </label>
          <label className="block text-sm font-medium text-gray-700">Peran
            <select name="role" defaultValue="user" className={INPUT}>{Object.entries(ROLE).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
          </label>
          <label className="block text-sm font-medium text-gray-700">Password awal (min. 8 karakter)
            <PasswordInput name="password" minLength={8} required autoComplete="new-password" />
          </label>
        </div>
        <button className={`${BTN} sm:self-end sm:px-8`}>Simpan Akun</button>
      </form>

      <div className={`${CARD} overflow-x-auto`}>
        <Title icon={ShieldCheck}>Akun & Akses Sistem <span className="font-normal text-gray-500">({users.length})</span></Title>
        <table className="w-full text-left text-xs [&_td]:px-3 [&_td]:py-2.5">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              {['NIK', 'Nama', 'Departemen', 'Peran', 'Status'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
              {sistem.map((s) => <th key={s.kode} className="px-3 py-2 text-center font-semibold">Akses<br />{s.nama}</th>)}
              <th className="px-3 py-2 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u, i) => {
              const self = u.nik === me.nik
              const patch = (body, ok) => run(`/users/${u.id}`, body, ok, 'PATCH')
              const group = users.filter((x) => x.dept === u.dept) // data sudah diurutkan per departemen
              return (
                <Fragment key={u.id}>
                  {(i === 0 || users[i - 1].dept !== u.dept) && (
                    <tr className="border-t-2 border-gray-200 bg-gray-100 font-semibold text-gray-900">
                      <td colSpan={5}>{u.dept ?? 'Tanpa departemen'} ({group.length})</td>
                      {sistem.map((s) => {
                        const all = group.every((x) => x.akses.includes(s.kode))
                        return (
                          <td key={s.kode} className="text-center">
                            <button className={MINI} onClick={() => akses(s, group.map((x) => x.nik), !all, `Akses ${s.nama} untuk ${u.dept ?? 'tanpa departemen'} ${all ? 'dicabut' : 'dibuka'}.`)}>
                              {all ? 'Hapus semua' : 'Centang semua'}
                            </button>
                          </td>
                        )
                      })}
                      <td />
                    </tr>
                  )}
                  <tr className={u.active ? 'hover:bg-gray-50' : 'text-gray-400'}>
                    <td className="whitespace-nowrap font-mono">{u.nik}</td>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${u.active ? 'bg-gray-950 text-white' : 'bg-gray-200 text-gray-500'}`}>{u.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                        <span className="font-semibold">{u.name}{self && <span className="font-normal text-gray-500"> (Anda)</span>}</span>
                      </span>
                    </td>
                    <td>
                      {/* key ikut dept: isian kembali ke nilai server setelah dimuat ulang */}
                      <input key={`${u.id}-${u.dept}`} defaultValue={u.dept ?? ''} list="depts" aria-label={`Departemen ${u.name}`} className={`${SMALL} w-36`}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        onBlur={(e) => e.target.value.trim() !== (u.dept ?? '') && patch({ dept: e.target.value }, `Departemen ${u.name} diubah.`)} />
                    </td>
                    <td>
                      <select value={u.role} disabled={self} aria-label={`Peran ${u.name}`} className={SMALL} onChange={(e) => patch({ role: e.target.value }, `Peran ${u.name} diubah.`)}>
                        {Object.entries(ROLE).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                      </select>
                    </td>
                    <td><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold ring-1 ${u.active ? 'bg-white text-gray-900 ring-gray-300' : 'bg-gray-50 text-gray-500 ring-gray-200'}`}><i aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-gray-950' : 'bg-gray-300'}`} />{u.active ? 'Aktif' : 'Nonaktif'}</span></td>
                    {sistem.map((s) => {
                      const on = u.akses.includes(s.kode)
                      return (
                        <td key={s.kode} className="text-center">
                          <input type="checkbox" checked={on} aria-label={`Akses ${s.nama} untuk ${u.name}`} className="h-5 w-5 accent-gray-900"
                            onChange={() => akses(s, [u.nik], !on, `Akses ${s.nama} untuk ${u.name} ${on ? 'dicabut' : 'dibuka'}.`)} />
                        </td>
                      )
                    })}
                    <td className="min-w-60 [&>button]:m-0.5">
                      <button className={MINI} onClick={async () => { const n = await dialog({ title: 'Ubah nama', text: `Nama baru untuk ${u.name}:`, input: u.name }); if (n) patch({ name: n }, 'Nama diubah.') }}>Nama</button>
                      <button className={MINI} onClick={async () => { const n = await dialog({ title: 'Ubah NIK', text: `NIK baru untuk ${u.name}. Ganti juga NIK-nya di tiap sistem (Safety Patrol, dst.), karena SSO mencocokkan NIK.`, input: u.nik }); if (n) patch({ nik: n }, `NIK ${u.name} diubah.`) }}>NIK</button>
                      <button className={MINI} onClick={async () => { const p = await dialog({ title: 'Reset password', text: `Password baru untuk ${u.name} (min. 8 karakter). Sesi yang sedang berjalan akan keluar.`, input: '', type: 'password', minLength: 8 }); if (p) patch({ password: p }, `Password ${u.name} direset.`) }}>Password</button>
                      {!self && <>
                        <button className={MINI} onClick={() => patch({ active: !u.active }, `${u.name} ${u.active ? 'dinonaktifkan' : 'diaktifkan'}.`)}>{u.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                        <button className={`${MINI} text-red-600`} onClick={async () => { if (await dialog({ title: `Hapus akun ${u.name}?`, text: 'Akun dan aksesnya terhapus permanen. Karyawan keluar cukup dinonaktifkan.', ok: 'Hapus', danger: true })) run(`/users/${u.id}`, undefined, `Akun ${u.name} dihapus.`, 'DELETE') }}>Hapus</button>
                      </>}
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500">
          Centang = boleh masuk sistem itu dari Superapps. Orang tersebut juga harus punya akun aktif ber-NIK sama di sistem tujuan.
          Mengganti NIK di sini tidak mengganti NIK di sistem lain.
        </p>
      </div>
    </div>
  )
}
