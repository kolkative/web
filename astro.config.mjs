import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://kolkative.my.id",
  integrations: [
    tailwind(),
    preact(),
  ],
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },
});
