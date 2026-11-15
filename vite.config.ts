import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite-plus";

/** Paths the gateway routes to the services. `/mcp` carries the Flame Lab (docs/frontend_flame_lab.md §8). */
const GATEWAY_PATHS = ["/profiles", "/chat", "/mcp"];

export default defineConfig(({ mode }) => {
  // GATEWAY_URL is read from the environment, never hard-coded (e.g. http://localhost:8080).
  const gateway = loadEnv(mode, ".", "").GATEWAY_URL;
  return {
    plugins: [
      // Must come before the React plugin: it generates src/routeTree.gen.ts from src/routes.
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
    ],
    server: {
      // With GATEWAY_URL set, the dev server forwards the API paths to the gateway,
      // so the browser stays same-origin exactly as it is in production.
      proxy: gateway
        ? Object.fromEntries(GATEWAY_PATHS.map((p) => [p, { target: gateway, changeOrigin: true }]))
        : undefined,
    },
    // .agents and .claude hold third-party agent skills (skills-lock.json): not project code.
    // docs/ARCHITECTURE.md and the two Flame Lab documents are the team's shared documents:
    // keep them byte-identical to theirs.
    fmt: {
      ignorePatterns: [
        "src/routeTree.gen.ts",
        "pnpm-lock.yaml",
        "dist",
        ".agents",
        ".claude",
        "docs/ARCHITECTURE.md",
        "docs/frontend_flame_lab.md",
        "docs/prediction_flow.md",
      ],
    },
    lint: {
      ignorePatterns: ["src/routeTree.gen.ts", "dist", ".agents", ".claude"],
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  };
});
