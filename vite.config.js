import { defineConfig as defineTestConfig, mergeConfig } from "vitest/config";
import { defineConfig } from "vite";
import { resolve } from "path";

const base =
  process.env.NODE_ENV === "production" ? "/front_7th_chapter2-2/" : "";

export default mergeConfig(
  defineConfig({
    esbuild: {
      jsx: "transform",
      jsxFactory: "createVNode",
      jsxDev: false,
    },
    optimizeDeps: {
      esbuildOptions: {
        jsx: "transform",
        jsxFactory: "createVNode",
        jsxDev: false,
      },
    },
    base,
    build: {
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
  }),
  defineTestConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      exclude: ["**/e2e/**", "**/*.e2e.spec.js", "**/node_modules/**"],
    },
  }),
);
