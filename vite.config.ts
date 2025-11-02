import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { componentTagger } from "lovable-tagger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "::",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    strictPort: false,
    // Allow Render hosts (supports all .onrender.com subdomains)
    allowedHosts: [
      "trainify-ai-ko8x.onrender.com",
      ".onrender.com", // Allow all Render subdomains
      "localhost",
      "127.0.0.1",
    ],
    cors: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));
