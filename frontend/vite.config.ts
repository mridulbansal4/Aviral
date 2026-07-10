import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind all interfaces on port 3000 so the app is reachable at http://<ip>:3000.
    host: true,
    port: 3000,
    strictPort: true,
    // Allow the app to be served under any hostname/IP (dev-server host check).
    allowedHosts: true,
    // Local dev convenience: forward /api to the backend so localhost needs no CORS.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
  // Pre-bundle all installed libraries so Vite never needs --force
  // on first run on any machine. Also prevents "does not provide an
  // export named" SyntaxErrors for TypeScript-only types.
  optimizeDeps: {
    include: [
      'lightweight-charts',
      '@xyflow/react',
      '@dagrejs/dagre',
      '@tanstack/react-table',
      '@floating-ui/react',
      '@floating-ui/dom',
      'react-hook-form',
      'zod',
      '@hookform/resolvers/zod',
      'framer-motion',
      'sonner',
      'lucide-react',
    ]
  }
})
