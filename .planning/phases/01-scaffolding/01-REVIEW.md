---
phase: 01-scaffolding
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - .gitignore
  - esbuild.config.mjs
  - manifest.json
  - package.json
  - src/main.ts
  - styles.css
  - tsconfig.json
  - versions.json
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This is the scaffolding phase output — project configuration files and a stub plugin entry point. The code itself (`src/main.ts`) is minimal and correct. The issues are concentrated in configuration files: `tsconfig.json` deviates from the project's own CLAUDE.md recommendations in two ways that will cause real build problems, `package.json` pins `@types/node` to a version incompatible with the Node runtime in use, and `esbuild.config.mjs` is missing a `--watch` mode for the dev script. No security or logic bugs in the plugin source itself.

---

## Warnings

### WR-01: tsconfig.json uses `moduleResolution: "node"` instead of `"bundler"`

**File:** `tsconfig.json:13`
**Issue:** `"moduleResolution": "node"` is set, but CLAUDE.md explicitly requires `"moduleResolution": "bundler"` (introduced in TypeScript 5.0). With `"node"` resolution and `"module": "ESNext"`, TypeScript will require `.js` extensions on relative imports and may mis-resolve package exports fields. esbuild uses bundler-style resolution, so mismatches between tsc type-checking and esbuild bundling can hide import errors until runtime.
**Fix:**
```json
"moduleResolution": "bundler"
```

### WR-02: tsconfig.json `target` is `"ES6"` instead of `"ES2018"`

**File:** `tsconfig.json:8`
**Issue:** CLAUDE.md specifies `"target": "ES2018"` as the safe baseline for Electron (Obsidian's runtime), enabling native async/await without down-level transforms. `"ES6"` forces tsc to emit async/await as generator-based polyfills when type-checking reports, and it misrepresents the actual target to tooling. esbuild is separately configured to `es2018`, so the mismatch means tsc and esbuild check against different feature sets. This can hide code patterns that work in esbuild output but generate incorrect types under tsc.
**Fix:**
```json
"target": "ES2018"
```

### WR-03: tsconfig.json `lib` is missing `"ES2018"` and includes redundant entries

**File:** `tsconfig.json:21`
**Issue:** `"lib": ["DOM", "ES5", "ES6", "ES7"]` is missing `"ES2018"`, which is needed to get Promise-related types (e.g., `Promise.prototype.finally`) that align with the ES2018 target. CLAUDE.md specifies `["ES2018", "DOM"]`. The current lib also lacks `"ES2017"` (which brings `Object.entries`, `Object.values`) — this means TypeScript will not type-check usage of those built-ins that are already available in ES2018 Electron. Listing `"ES5"`, `"ES6"`, `"ES7"` individually instead of the cumulative `"ES2018"` is harmless but verbose; swapping to `"ES2018"` is cleaner and correct.
**Fix:**
```json
"lib": ["ES2018", "DOM"]
```

### WR-04: `package.json` pins `@types/node` to `^16.11.6`, incompatible with Node 22 runtime

**File:** `package.json:14`
**Issue:** The active Node runtime is v22.18.0 (confirmed via `node --version`). `@types/node@^16` provides type stubs for Node 16 APIs only. Node 22 ships APIs not present in `@types/node@16` (e.g., updated `fetch`, `crypto`, `stream` signatures). When `@types/node` is used in the esbuild build script (the only place Node types are needed, per CLAUDE.md), this version mismatch causes tsc to report false-positive errors or miss real errors on Node 22 built-ins. CLAUDE.md specifies `@types/node ~18.x` as the minimum.
**Fix:**
```json
"@types/node": "^18.0.0"
```
Note: `^22.x` is also acceptable and more precise for the actual runtime in use.

---

## Info

### IN-01: `esbuild.config.mjs` does not implement `--watch` mode for dev

**File:** `esbuild.config.mjs:1`
**Issue:** The `dev` npm script (`node esbuild.config.mjs`) runs a one-shot build, not a watch build. CLAUDE.md specifies that the dev workflow should use esbuild's watch mode so the plugin reloads on file save without manual rebuilds. The current config exits immediately after one build, requiring a manual `npm run dev` on every change.
**Fix:**
```js
if (prod) {
  await esbuild.build({ ...options, minify: true, sourcemap: false });
} else {
  const ctx = await esbuild.context({ ...options, sourcemap: "inline" });
  await ctx.watch();
  console.log("watching...");
}
```
Where `options` holds the shared config object (entryPoints, bundle, external, format, target, etc.).

### IN-02: `manifest.json` has an empty `authorUrl`

**File:** `manifest.json:8`
**Issue:** `"authorUrl": ""` is an empty string. While not a runtime error, an empty `authorUrl` is shown in the Obsidian community plugin browser and looks unfinished. Either remove the key or provide a URL (e.g., GitHub profile).
**Fix:** Remove the key or set it to a real URL:
```json
"authorUrl": "https://github.com/your-username"
```

### IN-03: `styles.css` is empty

**File:** `styles.css:1`
**Issue:** The file exists but contains no content. This is expected for scaffolding — no styles are needed yet. No action required now, but the file should either be populated or removed before release to avoid shipping an empty asset.
**Fix:** No action required at this phase. Remove or populate before plugin submission.

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
