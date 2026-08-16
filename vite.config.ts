import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5001,
    strictPort: true, // Guarantees Vite runs on port 5001
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend Express API port target
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
