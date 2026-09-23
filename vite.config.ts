import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  css: {
    postcss: {}
  },
  server: {
    host: true,
    port: 3000
  }
});
