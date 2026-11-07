import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1500 },
  optimizeDeps: { exclude: ['pyodide'] },
  server: { port: 5173 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
