import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gescom.digital',
  output: 'static',
  trailingSlash: 'never',
  publicDir: './static',
  build: { format: 'file' },
});
