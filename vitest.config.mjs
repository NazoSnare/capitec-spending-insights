import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.js"],
    include: ["**/*.test.{js,jsx}"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    css: false,
  },
});
