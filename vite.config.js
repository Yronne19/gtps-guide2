import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // server: { host: "127.0.0.1", port: 5173 },
  // Vercel serves from the domain root; set VITE_BASE_PATH for subpath hosting
  base: process.env.VITE_BASE_PATH || '/',
});
