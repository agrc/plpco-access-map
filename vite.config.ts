import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const arcgisCorePath = new URL('./node_modules/@arcgis/core', import.meta.url).pathname;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: [
      {
        find: /^@arcgis\/core\/(.*)$/,
        replacement: `${arcgisCorePath}/$1`,
      },
      {
        find: '@arcgis/core',
        replacement: arcgisCorePath,
      },
    ],
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    environment: 'happy-dom',
  },
});
