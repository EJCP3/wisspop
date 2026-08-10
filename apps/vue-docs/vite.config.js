import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Apunta a `src` y no a `dist`: banco de pruebas real contra el código vivo
      wisspop: fileURLToPath(new URL("../../packages/wisspop/src", import.meta.url)),
    },
  },
});
