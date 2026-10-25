import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" یعنی روی هر ریپوی GitHub Pages بدون تنظیم اضافه کار می‌کند
export default defineConfig({
  base: "./",
  plugins: [react()],
});
