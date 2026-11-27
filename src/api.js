// Semua data lewat API Laravel (app/, routes/api.php). Vite meneruskan /api ke Laravel.
const KEY = 'token'

export async function api(path, { body, method = body ? 'POST' : 'GET' } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    body: body && JSON.stringify(body),
    headers: { Accept: 'application/json', Authorization: `Bearer ${localStorage.getItem(KEY)}`, ...(body && { 'Content-Type': 'application/json' }) },
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Server error (${res.status})`)
  return data
}

export const hasToken = () => !!localStorage.getItem(KEY)

export async function login(nik, password) {
  const { token } = await api('/login', { body: { nik, password } })
  localStorage.setItem(KEY, token)
}

export function logout() {
  api('/logout', { method: 'POST' }).catch(() => {}).finally(() => {
    localStorage.removeItem(KEY)
    location.reload()
  })
}
