import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // /api diteruskan ke Laravel (php artisan serve --port=8001). Port beda dari Safety Patrol agar bisa jalan bersamaan.
  server: { port: 5174, proxy: { '/api': 'http://127.0.0.1:8001' } },
})
