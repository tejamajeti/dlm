import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5001,
    strictPort: true, // Guarantees Vite runs on port 5001
    watch: {
      usePolling: true, // Enables instant live reload inside Docker Desktop on Windows
      interval: 100,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend Express API port target
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
