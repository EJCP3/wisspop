import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [vue(), dts({ include: ["src"], exclude: ["src/**/*.test.js"] })],
  build: {
    lib: {
      entry: {
        core: "src/core/index.js",
        vanilla: "src/vanilla/index.js",
        vue: "src/vue/index.js",
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // Los trae el consumidor. `vue` solo lo necesita quien importe `wisspop/vue`.
      external: ["gsap", "gsap/Flip", "vue"],
    },
  },
});
