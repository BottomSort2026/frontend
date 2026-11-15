import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite-plus";
import type { InvestigationsReport } from "./src/investigations/report";
import { slimReport } from "./src/investigations/slim";

/**
 * Paths the gateway answers. `/lab` is the Flame Lab (docs/frontend_flame_lab.md §8); `/datasets`
 * is the Lab's training CSV, served by the gateway itself.
 */
const GATEWAY_PATHS = ["/profiles", "/chat", "/lab", "/datasets"];

const REPORT_ID = "virtual:investigations-url";

/**
 * `import url from "virtual:investigations-url"` is the URL of the slim report: the generated
 * src/data/investigations.json with only the fields the view renders (src/investigations/slim.ts),
 * minified. The build emits it as a hashed asset; the dev server serves it from memory and
 * rebuilds it when the report changes.
 */
function investigationsReport(): Plugin {
  let serve = false;
  let source = "";
  let devUrl = "";
  let devBody = "";
  return {
    name: "investigations-report",
    configResolved(config) {
      serve = config.command === "serve";
      source = `${config.root}/src/data/investigations.json`;
      devUrl = `${config.base}investigations.json`;
    },
    resolveId: (id) => (id === REPORT_ID ? `\0${REPORT_ID}` : null),
    async load(id) {
      if (id !== `\0${REPORT_ID}`) return null;
      this.addWatchFile(source);
      const full = JSON.parse(await this.fs.readFile(source, { encoding: "utf8" }));
      const body = JSON.stringify(slimReport(full as InvestigationsReport));
      if (serve) {
        devBody = body;
        return `export default ${JSON.stringify(devUrl)};`;
      }
      const ref = this.emitFile({ type: "asset", name: "investigations.json", source: body });
      return `export default import.meta.ROLLUP_FILE_URL_${ref};`;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req as { url?: string }).url?.split("?")[0] !== devUrl) return next();
        // Requested before the app imported the module: build it now.
        const ready = devBody
          ? Promise.resolve()
          : server.environments.client.transformRequest(REPORT_ID);
        ready.then(() => {
          res.setHeader("Content-Type", "application/json");
          res.end(devBody);
        }, next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // GATEWAY_URL is read from the environment, never hard-coded (e.g. http://localhost:8080).
  const gateway = loadEnv(mode, ".", "").GATEWAY_URL;
  return {
    plugins: [
      // Must come before the React plugin: it generates src/routeTree.gen.ts from src/routes.
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      investigationsReport(),
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
        // Generated report (see src/investigations/report.ts): kept byte-identical to its source.
        "src/data/investigations.json",
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
