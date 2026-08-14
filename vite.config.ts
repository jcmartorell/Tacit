import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const root = import.meta.dirname;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        sphereExport: resolve(root, "sphere-export.html"),
        sphereExportSlides: resolve(root, "sphere-export-slides.html"),
        spherePreviewSlides: resolve(root, "sphere-preview-slides.html"),
      },
    },
  },
});
