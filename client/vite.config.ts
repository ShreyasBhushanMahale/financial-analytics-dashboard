import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // The API's CLIENT_ORIGIN (CORS) is http://localhost:5173, so never drift to another port.
    port: 5173,
    strictPort: true,
    proxy: {
      // Same-origin /api calls in dev; the target must match PORT in server/.env.
      '/api': 'http://localhost:4000',
    },
  },
});
