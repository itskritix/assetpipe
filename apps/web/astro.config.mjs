import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),
  integrations: [tailwind()],
  vite: {
    ssr: {
      noExternal: ['@supabase/supabase-js', '@supabase/ssr'],
    },
  },
});
