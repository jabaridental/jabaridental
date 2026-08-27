// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = 'https://jabaridental.com';

export default defineConfig({
  site: SITE,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/studio') &&
        !page.includes('/api/') &&
        !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  dev: {
    port: 4321,
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
