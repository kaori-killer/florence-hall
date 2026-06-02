import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: "forks",
    fileParallel: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
