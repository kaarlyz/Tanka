import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("/node_modules/katex/")) {
            return "vendor-katex";
          }
          if (
            id.includes("/node_modules/react-markdown/") ||
            id.includes("/node_modules/remark-gfm/") ||
            id.includes("/node_modules/remark-math/") ||
            id.includes("/node_modules/rehype-katex/")
          ) {
            return "vendor-markdown";
          }
          if (id.includes("/node_modules/lucide-react/")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
});
