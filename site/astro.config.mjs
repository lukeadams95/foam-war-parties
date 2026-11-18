import { defineConfig } from 'astro/config';

// Set `site` to the production domain so canonical and Open Graph URLs are absolute.
export default defineConfig({
  site: 'https://foambattleparties.com',
  trailingSlash: 'always',
});
