import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vitePluginHtmlEnv from 'vite-plugin-html-env';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginHtmlEnv({ prefix: '{{', suffix: '}}' })],
  base: './',
});
