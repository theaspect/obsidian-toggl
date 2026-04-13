---
phase: 06-release
reviewed: 2026-04-13T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .github/workflows/release.yml
  - version-bump.mjs
  - .npmrc
  - package.json
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-13
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the release automation files: GitHub Actions workflow, version-bump script, npm config, and package.json. No critical security issues were found. Four warnings were identified — two in `version-bump.mjs` (missing input validation and a silent no-op guard), one in the workflow (overly broad tag pattern admitting pre-release tags), and one in `package.json` (runtime vs devDependencies misclassification). Two info-level items cover an empty author field and an unpinned `obsidian` type package.

## Warnings

### WR-01: version-bump.mjs — No guard against running outside `npm version`

**File:** `version-bump.mjs:7`
**Issue:** `process.env.npm_package_version` is only set when the script is invoked via an `npm version` lifecycle hook. If someone runs `node version-bump.mjs` directly (e.g., debugging or from a CI step that calls it out of context), `targetVersion` is `undefined`. The script then writes `"version": undefined` into `manifest.json` (serialized as the JSON key is omitted by `JSON.stringify`), silently corrupting the manifest. The same `undefined` value is used as the key in `versions.json`.

**Fix:**
```js
const targetVersion = process.env.npm_package_version;
if (!targetVersion) {
  console.error("Error: npm_package_version is not set. Run this script via `npm version`, not directly.");
  process.exit(1);
}
```

---

### WR-02: version-bump.mjs — Silent skip when version key already exists

**File:** `version-bump.mjs:20`
**Issue:** The guard `if (!versions[targetVersion])` skips the `writeFileSync` call entirely when the key already exists. If `minAppVersion` in `manifest.json` was updated between two attempts at the same version bump (e.g., after a failed release that required bumping `minAppVersion`), the stale `versions.json` entry persists with no warning or error. The developer has no indication that the file was not updated.

**Fix:** Add a warning log when the skip fires, so the developer knows the entry was not updated:
```js
if (!versions[targetVersion]) {
  versions[targetVersion] = minAppVersion;
  writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
} else {
  console.warn(`versions.json: entry for ${targetVersion} already exists, skipping write.`);
}
```

---

### WR-03: release.yml — Tag pattern admits pre-release tags

**File:** `.github/workflows/release.yml:6`
**Issue:** The pattern `[0-9]+.[0-9]+.[0-9]+*` uses a trailing `*` wildcard that matches any suffix after the patch number. Tags like `1.0.0-rc1`, `1.0.0-beta`, or `1.0.0anything` will trigger a production release. This is likely unintentional — pre-release tags should not trigger the workflow that publishes to the Obsidian community registry.

Note: the `.` in a GitHub Actions tag glob is a literal character (not a regex wildcard), so the dots are correct. Only the trailing `*` is the issue.

**Fix:** If pre-release tags are not needed, use an exact pattern with no trailing wildcard:
```yaml
on:
  push:
    tags:
      - "[0-9]+.[0-9]+.[0-9]+"
```
If pre-release builds are desired in future, use a separate workflow or job conditioned on the tag suffix.

---

### WR-04: package.json — @codemirror packages listed as runtime dependencies

**File:** `package.json:23-26`
**Issue:** `@codemirror/state` and `@codemirror/view` are in `dependencies` rather than `devDependencies`. Obsidian plugins are fully bundled into `main.js` by esbuild at build time — there are no runtime npm dependencies. Listing them under `dependencies` is misleading and could confuse tooling (e.g., `npm audit`, Dependabot, or anyone reading the manifest). It also means `npm install --production` in a CI environment would include them unnecessarily.

**Fix:**
```json
"devDependencies": {
  "@codemirror/state": "^6.6.0",
  "@codemirror/view": "^6.41.0",
  "@types/node": "^16.11.6",
  ...
},
"dependencies": {}
```

---

## Info

### IN-01: package.json — author field is empty

**File:** `package.json:8`
**Issue:** `"author": ""` is an empty string. The Obsidian community plugin submission process requires the author field to match the `author` field in `manifest.json`. `manifest.json` has `"author": "Constantine"` but `package.json` has `""`. These should be consistent, and `package.json` is the one that needs updating.

**Fix:**
```json
"author": "Constantine"
```

---

### IN-02: package.json — obsidian package pinned to `latest`

**File:** `package.json:17`
**Issue:** `"obsidian": "latest"` is an unpinned floating reference. The `obsidian` npm package ships Obsidian's TypeScript type definitions. A semver-major or breaking type change would silently change the build environment on the next `npm install`, potentially causing type errors or mismatched API usage with no indication of what changed.

**Fix:** Pin to a specific version (or at minimum a caret range):
```json
"obsidian": "^1.5.0"
```
Run `npm ls obsidian` to find the currently resolved version, then pin to that.

---

_Reviewed: 2026-04-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
