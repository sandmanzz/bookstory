import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // A production build without an API URL would silently point at localhost and ship a broken site.
  // Fail the build loudly instead, so a forgotten Vercel environment variable is caught at deploy time.
  if (mode === 'production' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL) {
    throw new Error('VITE_API_URL is not set. Set it to your deployed API URL (no trailing slash) before building for production.');
  }
  return { plugins: [react(), tailwindcss()] };
});
