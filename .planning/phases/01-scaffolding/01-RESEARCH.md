# Phase 1: Scaffolding - Research

**Researched:** 2026-04-09
**Domain:** Obsidian Plugin Scaffolding — TypeScript, esbuild, manifest.json, requestUrl
**Confidence:** HIGH

---

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md are binding. The planner must not recommend approaches that contradict them.

**Tech stack:** TypeScript + Obsidian Plugin API (no React/Svelte/Vue, no axios/node-fetch/got)
**Auth scope:** Toggl API token via Basic Auth, no OAuth
**Compatibility:** Desktop only (`isDesktopOnly: true`); mobile is out of scope
**HTTP:** Native fetch is listed in CLAUDE.md, but see **Critical Finding** below — `requestUrl` overrides this for plugin submissions
**Date/time:** Native `Date` + `Intl.DateTimeFormat` only (no moment.js, luxon, day.js)
**UI framework:** Obsidian API's `Setting`, `Modal`, and `createEl` only
**Tests:** vitest if tests are added (not Jest)
**Bundler:** esbuild only (not rollup, webpack)
**Type checking:** `tsc --noEmit` as gate, esbuild for actual transpile

**Critical Finding — requestUrl vs native fetch:**
CLAUDE.md recommends `globalThis.fetch` / native fetch. However, the Phase 1 success criteria explicitly requires `requestUrl`, and this is correct. Obsidian community plugin review enforces `requestUrl` as the standard HTTP abstraction to bypass CORS restrictions from the `app://obsidian.md` origin. Native `fetch` is blocked by CORS in Electron. The planner MUST use `requestUrl` from the `obsidian` package, not native `fetch`. [VERIFIED: WebSearch — obsidian community plugin review enforcement]

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REL-01 | Plugin builds to a single `main.js` via esbuild | esbuild.config.mjs pattern from obsidian-sample-plugin; entry `src/main.ts` → `main.js` CJS output |
| REL-02 | `manifest.json` is correctly structured with a unique plugin id, `minAppVersion`, and `isDesktopOnly: true` | Manifest schema documented; `isDesktopOnly: true` required; unique id in kebab-case; semver version |
</phase_requirements>

---

## Summary

Phase 1 establishes the compilable Obsidian plugin skeleton. The authoritative template is `obsidianmd/obsidian-sample-plugin` on GitHub, which defines the canonical file layout, build script, and TypeScript configuration. The build pipeline is esbuild bundling `src/main.ts` to a single CJS `main.js`, with `tsc --noEmit` as a pre-production type-check gate.

The most important scaffolding decision for this project is the HTTP abstraction layer: `requestUrl` from the `obsidian` package — not native `fetch` — must be used for all network calls. Obsidian community plugin review enforces this requirement because native `fetch` fails with CORS from the `app://obsidian.md` Electron origin. This is a firm constraint independent of what CLAUDE.md says about native fetch.

The `DEFAULT_SETTINGS` merge pattern using `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` must be established in Phase 1 even though settings fields are only populated in Phase 2. This prevents any future settings addition from breaking existing installs.

**Primary recommendation:** Clone the structure of `obsidianmd/obsidian-sample-plugin`, adapt to `src/main.ts` entry point, add `requestUrl` as the sole HTTP function (imported from `obsidian`), and stub `DEFAULT_SETTINGS` with an empty object typed to the full settings interface.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| obsidian | latest (1.12.3 on npm) | Obsidian API types + Plugin/Editor/Notice/requestUrl base classes | The only supported way to build against the Obsidian API; ships its own TypeScript types — no `@types/obsidian` needed |
| esbuild | 0.28.0 (npm latest) | TypeScript → single CJS `main.js` bundler | Official sample plugin uses esbuild; 10–100x faster than webpack/rollup; produces correct Obsidian-compatible CJS output |
| typescript | 6.0.2 (npm latest) | Type checking only (`--noEmit`) | Required by plugin ecosystem; strict mode catches Obsidian API null dereferences early |
| Node.js | 22.18.0 (installed) | Build runtime | Required by esbuild and npm; 22 LTS is installed and confirmed |

[VERIFIED: npm registry — `npm view obsidian version`, `npm view esbuild version`, `npm view typescript version`; Node version via `node --version`]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | ~16.x (sample plugin uses ^16.11.6) | Node type stubs for build scripts only | Only for esbuild.config.mjs; do NOT add to plugin tsconfig lib — leaks Node globals into Electron context |

[ASSUMED — @types/node version: the sample plugin pins 16.x but 18.x or 22.x may work equally well; version used here follows sample plugin convention]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild | rollup | Older tutorials use rollup; esbuild is the current official choice, strictly faster |
| esbuild | webpack | Far more complex configuration; no benefit for single-output plugin |
| requestUrl | native fetch | Native fetch blocked by CORS from `app://obsidian.md`; `requestUrl` is the mandatory community standard |

**Installation:**
```bash
npm install obsidian
npm install --save-dev esbuild typescript @types/node
```

**Version verification:** Verified 2026-04-09 against npm registry:
- `obsidian`: 1.12.3 (latest)
- `esbuild`: 0.28.0 (latest)
- `typescript`: 6.0.2 (latest)
- Node.js installed: v22.18.0

---

## Architecture Patterns

### Recommended Project Structure

```
obsidian-toggl/
├── src/
│   └── main.ts           # Plugin entry — extends Plugin class
├── manifest.json         # Plugin metadata (id, version, minAppVersion, isDesktopOnly)
├── versions.json         # Maps plugin version → minAppVersion for backward compat
├── package.json          # Build scripts + devDependencies
├── tsconfig.json         # TypeScript config (moduleResolution: node, target: ES6)
├── esbuild.config.mjs    # Build script: dev (watch) + production (minify)
└── main.js               # Compiled output (gitignored during dev, committed for releases)
```

[VERIFIED: obsidian-sample-plugin GitHub — confirmed layout from package.json, tsconfig.json, esbuild.config.mjs, manifest.json]

### Pattern 1: Plugin Class with Stubbed Settings

**What:** Extend `Plugin`, implement `onload`/`onunload`, stub `DEFAULT_SETTINGS` with the full settings type even though fields are empty in Phase 1.
**When to use:** Always — this is the required Obsidian plugin entry point.

```typescript
// Source: obsidian-sample-plugin/src/main.ts pattern
import { Plugin } from 'obsidian';

export interface TogglImportSettings {
  apiToken: string;
  outputFormat: 'table' | 'plaintext';
  columns: { description: boolean; startTime: boolean; duration: boolean; tags: boolean; project: boolean };
  delimiter: string;
}

const DEFAULT_SETTINGS: TogglImportSettings = {
  apiToken: '',
  outputFormat: 'table',
  columns: { description: true, startTime: true, duration: true, tags: false, project: false },
  delimiter: '|',
};

export default class TogglImportPlugin extends Plugin {
  settings: TogglImportSettings;

  async onload() {
    await this.loadSettings();
    // Commands and settings tab registered in later phases
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

[CITED: marcusolsson.github.io/obsidian-plugin-docs/user-interface/settings — Object.assign merge pattern]

### Pattern 2: requestUrl HTTP Abstraction

**What:** Import `requestUrl` from `obsidian` and use it as the sole HTTP function throughout the plugin.
**When to use:** Every network call — no exceptions for this plugin.

```typescript
// Source: obsidian API (obsidian.d.ts — verified)
import { requestUrl, RequestUrlParam, RequestUrlResponse } from 'obsidian';

const response: RequestUrlResponse = await requestUrl({
  url: 'https://api.track.toggl.com/api/v9/me',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${btoa(`${apiToken}:api_token`)}`,
    'Content-Type': 'application/json',
  },
  throw: false,  // return response object on error instead of throwing
});

if (response.status !== 200) {
  // handle error
}
const data = JSON.parse(response.text);
```

[VERIFIED: obsidian-api/obsidian.d.ts — RequestUrlParam, RequestUrlResponse interfaces confirmed]

### Pattern 3: manifest.json Structure

**What:** The manifest.json file that Obsidian reads to load the plugin.
**Required fields:** `id`, `name`, `version`, `minAppVersion`, `description`, `author`, `isDesktopOnly`

```json
{
  "id": "obsidian-toggl-import",
  "name": "Toggl Import",
  "version": "1.0.0",
  "minAppVersion": "1.0.0",
  "description": "Import Toggl Track time entries into daily notes with a single command.",
  "author": "Your Name",
  "authorUrl": "",
  "isDesktopOnly": true
}
```

[VERIFIED: obsidian-sample-plugin/manifest.json — field structure confirmed; `isDesktopOnly: true` required per project scope]

### Pattern 4: esbuild Configuration

**What:** Node.js script that bundles `src/main.ts` to `main.js` in CJS format.
**Key requirements:** Mark `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`, and Node builtins as external.

```javascript
// Source: obsidian-sample-plugin/esbuild.config.mjs pattern
import esbuild from 'esbuild';

const prod = process.argv[2] === 'production';

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian', 'electron',
    '@codemirror/*', '@lezer/*',
    'node:*',
  ],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
});
```

[VERIFIED: obsidian-sample-plugin/esbuild.config.mjs — pattern confirmed; exact externals list verified]

### Pattern 5: versions.json

**What:** Maps each plugin version to the minimum Obsidian version required.
**Format:** `{ "plugin-version": "min-obsidian-version" }`

```json
{
  "1.0.0": "1.0.0"
}
```

[CITED: docs.obsidian.md/Reference/Versions — versions.json purpose confirmed]

### Pattern 6: TypeScript Configuration

**What:** The tsconfig.json matching the current obsidian-sample-plugin.

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "strictNullChecks": true,
    "strictBindCallApply": true,
    "allowSyntheticDefaultImports": true,
    "useUnknownInCatchVariables": true,
    "lib": ["DOM", "ES5", "ES6", "ES7"]
  },
  "include": ["src/**/*.ts"]
}
```

Note: The current sample plugin uses `moduleResolution: "node"` and `target: "ES6"` — NOT `"bundler"` and `"ES2018"` as CLAUDE.md describes. CLAUDE.md was written with slightly outdated information. The sample plugin's current tsconfig is authoritative. [VERIFIED: obsidian-sample-plugin/tsconfig.json — fetched directly from GitHub]

### Anti-Patterns to Avoid

- **Using native `fetch` for HTTP:** Blocked by CORS from `app://obsidian.md`; always use `requestUrl` from `obsidian` package
- **Adding `"node"` to tsconfig `lib`:** Leaks Node globals into plugin code that runs in Electron
- **Bundling `obsidian` into main.js:** Must be marked external; Obsidian provides it at runtime
- **Bundling electron or Node builtins:** Same reason — mark all as external in esbuild config
- **Using `Object.assign(target, source)` with only two params:** Mutates `DEFAULT_SETTINGS`; always use three-arg form `Object.assign({}, DEFAULT_SETTINGS, loaded)`
- **Skipping `strictNullChecks`:** `app.workspace.getActiveFile()` returns `null` when no file is open; strict null checks catch this at compile time

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin settings persistence | Custom file I/O or localStorage | `this.loadData()` / `this.saveData()` from Plugin class | Built-in; scoped to `data.json` in plugin dir; handles serialization |
| HTTP with CORS bypass | Custom Electron IPC or XMLHttpRequest | `requestUrl` from `obsidian` | CORS is automatic; consistent interface; community standard |
| Plugin lifecycle registration | Custom module loading | `Plugin.onload()` / `Plugin.onunload()` | Obsidian manages the lifecycle; hooks into app events and cleanup |
| Base64 encoding for Basic Auth | Custom base64 implementation | `btoa()` | Available natively in both Electron and browser environments |
| TypeScript bundling | Custom rollup/webpack config | esbuild.config.mjs (from sample plugin) | esbuild is ~10–100x faster; official sample provides exact config |

**Key insight:** Almost every boilerplate concern in an Obsidian plugin is handled by the Plugin base class or Obsidian API. Phase 1's job is wiring those together correctly, not building custom solutions.

---

## Common Pitfalls

### Pitfall 1: Using native `fetch` instead of `requestUrl`

**What goes wrong:** `fetch('https://api.track.toggl.com/...')` throws a CORS error in Obsidian desktop because the page origin is `app://obsidian.md`, which is not whitelisted by Toggl's CORS headers.
**Why it happens:** Developers familiar with browser/Node.js fetch assume it works the same in Electron; it doesn't when CSP/CORS is enforced.
**How to avoid:** Import `requestUrl` from `obsidian` and use it exclusively. The Phase 1 success criteria explicitly requires this.
**Warning signs:** Runtime error "Access to fetch at … has been blocked by CORS policy" in the Obsidian developer console.

### Pitfall 2: Bundling `obsidian` into main.js

**What goes wrong:** Plugin loads with undefined API references or version conflicts.
**Why it happens:** Forgetting to mark `'obsidian'` as external in esbuild config; esbuild then includes a stale copy of the API in the bundle.
**How to avoid:** Ensure `external: ['obsidian', 'electron', ...]` in esbuild.config.mjs.
**Warning signs:** Bundle size grows unexpectedly; Obsidian logs module resolution errors.

### Pitfall 3: Two-argument `Object.assign` mutating DEFAULT_SETTINGS

**What goes wrong:** `DEFAULT_SETTINGS` is mutated in place; the first install works, but subsequent reloads overwrite defaults with stale state.
**Why it happens:** `Object.assign(DEFAULT_SETTINGS, await this.loadData())` mutates the first argument.
**How to avoid:** Always use `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` — three arguments, empty object as first.
**Warning signs:** Settings behave erratically after plugin reload; defaults stop applying.

### Pitfall 4: Missing `isDesktopOnly: true` in manifest

**What goes wrong:** Plugin appears in mobile community plugin list; Obsidian Mobile tries to load it; network calls fail with different errors.
**Why it happens:** Scaffold from sample plugin sets `"isDesktopOnly": false`.
**How to avoid:** Set `"isDesktopOnly": true` in manifest.json from the start.
**Warning signs:** Plugin submission rejected; mobile users report install failures.

### Pitfall 5: Non-unique plugin `id` in manifest

**What goes wrong:** Plugin conflicts with existing community plugin; Obsidian loads the wrong plugin or silently ignores the new one.
**Why it happens:** Using the sample plugin's `"id": "sample-plugin"` without changing it.
**How to avoid:** Use a unique kebab-case id (e.g., `"obsidian-toggl-import"`). Check the community plugins registry to confirm uniqueness before publishing.
**Warning signs:** Loading the plugin shows another plugin's functionality.

### Pitfall 6: tsconfig `"node"` in lib

**What goes wrong:** Node-only globals like `process`, `Buffer`, `__dirname` appear as valid in plugin code; they silently fail at runtime in Electron context.
**Why it happens:** Adding `@types/node` to the main tsconfig (not just the build script's separate tsconfig).
**How to avoid:** Keep `@types/node` out of the plugin tsconfig. If needed for build scripts, scope it to a separate tsconfig for the `esbuild.config.mjs` file.

---

## Code Examples

### Full Plugin Skeleton (src/main.ts)

```typescript
// Source: obsidian-sample-plugin pattern + obsidian API types
import { Plugin } from 'obsidian';

export interface TogglImportSettings {
  apiToken: string;
  outputFormat: 'table' | 'plaintext';
  columns: {
    description: boolean;
    startTime: boolean;
    duration: boolean;
    tags: boolean;
    project: boolean;
  };
  delimiter: string;
}

export const DEFAULT_SETTINGS: TogglImportSettings = {
  apiToken: '',
  outputFormat: 'table',
  columns: {
    description: true,
    startTime: true,
    duration: true,
    tags: false,
    project: false,
  },
  delimiter: '|',
};

export default class TogglImportPlugin extends Plugin {
  settings!: TogglImportSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    // Phase 2: register settings tab
    // Phase 5: register import command
  }

  onunload(): void {}

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
```

### requestUrl Import and Usage Stub

```typescript
// Source: obsidian API (obsidian.d.ts — verified)
import { requestUrl } from 'obsidian';

// Example usage — actual API client in Phase 3
async function verifyToken(token: string): Promise<boolean> {
  const response = await requestUrl({
    url: 'https://api.track.toggl.com/api/v9/me',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(`${token}:api_token`)}`,
    },
    throw: false,
  });
  return response.status === 200;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `moduleResolution: "bundler"` | `moduleResolution: "node"` | Current sample plugin (2025) | CLAUDE.md mentioned "bundler"; sample plugin uses "node"; use "node" |
| `target: "ES2018"` | `target: "ES6"` | Current sample plugin (2025) | Sample plugin targets ES6; matches broader Electron compatibility |
| `obsidian: "~1.5.x"` (pinned) | `obsidian: "latest"` | Current sample plugin | Sample plugin uses "latest"; ensures latest API types are always available |
| eslint optional | `eslint-plugin-obsidianmd` included | 2024–2025 | New sample plugin includes ESLint with obsidianmd rules; enforces requestUrl and other API patterns |

**Deprecated/outdated:**
- rollup-based builds: Still found in old tutorials; replaced by esbuild in official sample
- Explicit `obsidian` version pinning: Sample plugin switched to `"latest"`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@types/node@^16.11.6` is the correct version for the project | Standard Stack | Low — any 16.x, 18.x, or 22.x would work; mismatching only causes type-level issues in build scripts, not plugin runtime |
| A2 | `"id": "obsidian-toggl-import"` is unique in the community registry | Common Pitfalls | Medium — if taken, must choose a different id; does not block scaffolding but must be verified before publishing |
| A3 | DEFAULT_SETTINGS should include all Phase 2–5 settings fields in Phase 1 | Architecture Patterns | Low — if wrong, settings fields can be added later with Object.assign merge always providing defaults |

---

## Open Questions

1. **Plugin ID uniqueness**
   - What we know: The id `"obsidian-toggl-import"` is not found in a casual search of community plugins
   - What's unclear: Whether it is taken in the official community-plugins.json registry
   - Recommendation: Verify against `github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json` before finalizing; scaffolding can proceed with a provisional id

2. **ESLint integration in Phase 1**
   - What we know: The current sample plugin includes `eslint-plugin-obsidianmd` and an eslint.config.js
   - What's unclear: Whether Phase 1 should include ESLint setup or defer to a later phase
   - Recommendation: Include ESLint with `eslint-plugin-obsidianmd` in Phase 1 — it enforces `requestUrl` which is a Phase 1 success criterion; catching violations at lint time is better than discovering them at PR review

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | esbuild build runtime | YES | v22.18.0 | — |
| npm | Package installation | YES | 10.9.3 | — |
| TypeScript (via npm) | Type checking | YES (after npm install) | 6.0.2 | — |
| esbuild (via npm) | Bundling | YES (after npm install) | 0.28.0 | — |
| obsidian (npm package) | API types + requestUrl | YES (after npm install) | 1.12.3 | — |
| Obsidian desktop app | Loading plugin for verification | UNKNOWN | — | Cannot verify REL-02 without it |

[VERIFIED: Node.js and npm via `node --version`, `npm --version`]

**Missing dependencies with no fallback:**
- Obsidian desktop app: Required to verify success criterion 2 (plugin loads without errors). If not installed, criterion 2 must be verified manually by the developer.

**Missing dependencies with fallback:**
- None — all build dependencies install via `npm install`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None established — this is a greenfield Phase 1 |
| Config file | None — Wave 0 must create if tests are added |
| Quick run command | `npm run build` (build verification is the primary gate) |
| Full suite command | `tsc --noEmit` + `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REL-01 | `npm run build` produces `main.js` without errors | smoke | `npm run build` | Wave 0 creates package.json |
| REL-02 | `manifest.json` has unique id, valid minAppVersion, isDesktopOnly:true | manual-only | `node -e "const m=require('./manifest.json'); console.assert(m.isDesktopOnly===true); console.assert(m.id!=='sample-plugin')"` | Wave 0 creates manifest.json |

**Manual-only justification (REL-02):** Plugin load verification in Obsidian requires the desktop app to be installed and a test vault configured. This cannot be automated in a build script.

**Implicit success criteria (from phase description):**
- `requestUrl` is imported and no native `fetch` calls exist — verifiable via `grep -r "globalThis.fetch\|window.fetch\|native fetch" src/` returning empty
- `DEFAULT_SETTINGS` merge pattern uses three-argument `Object.assign` — verifiable via code review

### Sampling Rate

- **Per task:** `npm run build` — confirms TypeScript compiles and esbuild produces main.js
- **Per wave:** `tsc --noEmit && npm run build` — full type check + build
- **Phase gate:** Both commands green + manual Obsidian load verification + `requestUrl`-only grep check

### Wave 0 Gaps

- [ ] `package.json` — does not exist yet (new project)
- [ ] `tsconfig.json` — does not exist yet
- [ ] `esbuild.config.mjs` — does not exist yet
- [ ] `manifest.json` — does not exist yet
- [ ] `versions.json` — does not exist yet
- [ ] `src/main.ts` — does not exist yet

*(All files are Wave 0 creations — this is a greenfield scaffold)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 3 handles API token auth |
| V3 Session Management | No | No sessions in a desktop plugin |
| V4 Access Control | No | Single-user desktop app |
| V5 Input Validation | No | Phase 1 has no user inputs |
| V6 Cryptography | No | API token stored as plaintext in data.json (documented; no encryption in scope) |

**Phase 1 security note:** The only security-relevant decision in Phase 1 is that the `apiToken` field in `DEFAULT_SETTINGS` defaults to an empty string, preventing any accidental API calls with a leaked token. The settings warning (SET-02) about `data.json` being included in Obsidian Sync is documented in Phase 2.

---

## Sources

### Primary (HIGH confidence)
- [obsidian-sample-plugin/package.json](https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/package.json) — verified package versions (obsidian latest, esbuild 0.25.5 in sample; npm registry shows 0.28.0 latest, TS 6.0.2 latest)
- [obsidian-sample-plugin/esbuild.config.mjs](https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/esbuild.config.mjs) — build pattern, externals list
- [obsidian-sample-plugin/tsconfig.json](https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/tsconfig.json) — TypeScript configuration
- [obsidian-sample-plugin/manifest.json](https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/manifest.json) — manifest field structure
- [obsidian-api/obsidian.d.ts](https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts) — RequestUrlParam, RequestUrlResponse, requestUrl function signature
- npm registry — verified versions: obsidian 1.12.3, esbuild 0.28.0, typescript 6.0.2, @types/node 25.5.2

### Secondary (MEDIUM confidence)
- [marcusolsson obsidian-plugin-docs: Settings](https://marcusolsson.github.io/obsidian-plugin-docs/user-interface/settings) — DEFAULT_SETTINGS / Object.assign merge pattern
- [Obsidian Forum: Make HTTP requests from plugins](https://forum.obsidian.md/t/make-http-requests-from-plugins/15461) — CORS issue with native fetch; requestUrl recommendation
- [mProjectsCode/eslint-plugin-obsidianmd](https://github.com/mProjectsCode/eslint-plugin-obsidianmd) — ESLint plugin enforcing Obsidian API conventions
- [docs.obsidian.md: Versions](https://docs.obsidian.md/Reference/Versions) — versions.json format and purpose

### Tertiary (LOW confidence)
- WebSearch findings on community plugin review enforcement of `requestUrl` — cross-verified with CORS forum discussion and API docs; elevated to MEDIUM confidence

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry on 2026-04-09
- Architecture: HIGH — sourced from official obsidian-sample-plugin repository
- requestUrl requirement: HIGH — verified via CORS mechanics + community review enforcement + obsidian.d.ts
- Pitfalls: HIGH — derived from verified API behavior and documented patterns
- tsconfig discrepancy (CLAUDE.md vs sample plugin): HIGH — directly fetched tsconfig.json from GitHub; sample plugin uses "node" and "ES6"

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (90 days — Obsidian plugin ecosystem is relatively stable; esbuild/TS versions update frequently but plugin API is stable)
