import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

let commitHash = 'dev';
try { commitHash = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  plugins: [react()],
  server: {
    proxy: {
      '/nhl-api': {
        target: 'https://api-web.nhle.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/nhl-api/, ''),
      },
      '/nhl-search': {
        target: 'https://search.d3.nhle.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/nhl-search/, ''),
      },
    },
  },
});
