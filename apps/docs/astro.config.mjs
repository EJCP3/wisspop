import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://wisspop.vercel.app',
  integrations: [tailwind()],
  vite: {
    ssr: {
      noExternal: ['wisspop']
    }
  }
});
