import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "client/public",
  build: {
    outDir: "dist",
  },
});
