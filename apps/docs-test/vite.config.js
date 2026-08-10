import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // Apunta a `src` y no a `dist`: las docs son también el banco de pruebas,
      // así se recarga en caliente sin rebuildear la librería en cada cambio.
      wisspop: fileURLToPath(new URL("../../packages/wisspop/src", import.meta.url)),
    },
  },
});
