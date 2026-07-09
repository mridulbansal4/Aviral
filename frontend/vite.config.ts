import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
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
