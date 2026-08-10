import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig({
  // Los .jsx del wrapper de React los transforma esbuild solo (jsx:
  // "automatic" = el runtime nuevo de React 17+, sin necesitar `import React`
  // en cada archivo). No hace falta @vitejs/plugin-react acá: ese trae Fast
  // Refresh para un dev server, y esto es un build de librería.
  esbuild: { jsx: "automatic" },
  plugins: [vue(), dts({ include: ["src"], exclude: ["src/**/*.test.js"] })],
  build: {
    lib: {
      entry: {
        core: "src/core/index.js",
        vanilla: "src/vanilla/index.js",
        vue: "src/vue/index.js",
        react: "src/react/index.js",
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // Los trae el consumidor. `vue` solo lo necesita quien importe
      // `wisspop/vue`, y lo mismo para `react`/`react-dom` con `wisspop/react`.
      external: ["gsap", "gsap/Flip", "vue", "react", "react-dom", "react/jsx-runtime"],
    },
  },
});
