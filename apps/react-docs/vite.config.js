import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Apunta a `src` y no a `dist`: banco de pruebas real contra el código
      // vivo, igual que hace apps/docs con la parte vanilla/Vue.
      wisspop: fileURLToPath(new URL("../../packages/wisspop/src", import.meta.url)),
    },
  },
});
