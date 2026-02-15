import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/norce-token': {
        target: 'https://norce-open-demo.api-se.playground.norce.tech/identity/1.0/connect/token',
        changeOrigin: true,
        rewrite: () => '',
      },
      '/norce-query': {
        target: 'https://norce-open-demo.api-se.playground.norce.tech/commerce/query/2.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/norce-query/, ''),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
