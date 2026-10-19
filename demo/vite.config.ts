import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/pdf-book-reader-audio/" : "/",
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "pdfjs-dist/legacy/build/pdf.mjs": fileURLToPath(
        new URL("./node_modules/pdfjs-dist/legacy/build/pdf.mjs", import.meta.url),
      ),
    },
  },
});
