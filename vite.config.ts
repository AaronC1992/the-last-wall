import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/the-last-wall/',
}));
