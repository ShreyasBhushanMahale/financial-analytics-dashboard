import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Adds a Content Security Policy to the production build. The session token lives in
 * localStorage, so the real defence is making sure no injected or third-party script can run:
 * scripts load only from our own origin, with no inline code and no eval.
 *
 * Styles allow 'unsafe-inline' because MUI (Emotion) injects its styles at runtime. Build-only,
 * because the dev server needs an inline script for React Fast Refresh.
 */
function contentSecurityPolicy(): Plugin {
  let apiOrigin = '';

  return {
    name: 'ledgerline-content-security-policy',
    apply: 'build',
    configResolved(config) {
      // A deployed client may call an API on another origin (VITE_API_BASE_URL); allow exactly that one.
      const env: Record<string, unknown> = config.env;
      const base = env.VITE_API_BASE_URL;
      if (typeof base === 'string' && /^https?:\/\//i.test(base)) apiOrigin = new URL(base).origin;
    },
    transformIndexHtml() {
      const policy = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data:",
        `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');

      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
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
