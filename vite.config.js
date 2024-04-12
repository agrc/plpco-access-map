/* eslint-env node */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});
