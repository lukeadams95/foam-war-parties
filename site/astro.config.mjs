import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set `site` to the production domain so canonical and Open Graph URLs are absolute.
export default defineConfig({
  site: 'https://foambattleparties.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '') || '/';
        return path !== '/thank-you' && path !== '/404';
      },
    }),
  ],
});
