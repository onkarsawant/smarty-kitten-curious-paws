// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages builds set GITHUB_PAGES_BUILD=1 and VITE_BASE_PATH=/<repo-name>/
// (a project site is served under /<repo>/, not at the domain root).
const isPagesBuild = process.env.GITHUB_PAGES_BUILD === "1";
const basePath = isPagesBuild ? process.env.VITE_BASE_PATH || "/" : "/";

// Docker builds set NITRO_PRESET=node-server; nitro 3 no longer reads that env
// var itself, so forward it here (its output lands in .output/).
const nitroPreset = process.env.NITRO_PRESET;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Pages build: the game is fully client-side with a single route, so render
    // "/" once at build time and ship the static output (.output/public).
    ...(isPagesBuild
      ? {
          pages: [{ path: "/" }],
          prerender: { enabled: true, autoStaticPathsDiscovery: false },
        }
      : {}),
  },
  vite: {
    base: basePath,
  },
});
