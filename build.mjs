import { build } from "esbuild";

const entry = "src/index.js";

// ESM — React / Vue / Svelte / modern Node
await build({
  entryPoints: [entry],
  outfile: "dist/index.js",
  format: "esm",
  platform: "neutral",
  minify: true,
  legalComments: "inline",
});

// CommonJS — require(), старый Node
await build({
  entryPoints: [entry],
  outfile: "dist/index.cjs",
  format: "cjs",
  platform: "node",
  minify: true,
  legalComments: "inline",
});

// Global / IIFE — CodePen, <script>
await build({
  entryPoints: [entry],
  outfile: "dist/index.global.js",
  bundle: true,
  format: "iife",
  globalName: "Sudoku",
  platform: "browser",
  minify: true,
  legalComments: "inline",
});

console.log("✅ Build complete!");
