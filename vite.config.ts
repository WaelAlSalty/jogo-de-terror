import { defineConfig } from 'vite';

export default defineConfig({
  base: '/jogo-de-terror/',
  css: {
    postcss: {}
  },
  server: {
    host: true,
    port: 3000
  }
});
