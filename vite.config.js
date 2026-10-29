import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use relative asset paths for GitHub Pages deployments.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
