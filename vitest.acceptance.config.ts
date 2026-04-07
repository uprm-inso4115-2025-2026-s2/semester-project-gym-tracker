import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/acceptance/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/acceptance/setup.ts"],
  },
});
