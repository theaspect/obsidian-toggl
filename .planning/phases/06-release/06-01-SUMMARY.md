---
phase: 06-release
plan: 01
subsystem: infra
tags: [github-actions, release, versioning, obsidian-plugin, npm]

# Dependency graph
requires:
  - phase: 05-command
    provides: Working plugin with npm run build script and gitignored main.js
provides:
  - Tag-triggered GitHub Actions release workflow (.github/workflows/release.yml)
  - Atomic version-bump script (version-bump.mjs) for updating manifest.json and versions.json
  - npm run version lifecycle script integration
  - .npmrc enforcing bare semver tags (no v prefix)
affects: [community-submission]

# Tech tracking
tech-stack:
  added: [softprops/action-gh-release@v2, actions/checkout@v4, actions/setup-node@v4]
  patterns:
    - "Tag-triggered release: push 1.0.x bare tag -> GitHub Actions builds and releases"
    - "npm version lifecycle: version script runs before npm commits, stages manifest.json + versions.json"

key-files:
  created:
    - .github/workflows/release.yml
    - version-bump.mjs
    - .npmrc
  modified:
    - package.json

key-decisions:
  - "Bare semver tags (1.0.0) not v-prefixed — Obsidian community validator requires tag == manifest.json version exactly"
  - "Key-based guard in version-bump.mjs (!versions[targetVersion]) replaces official sample plugin's value-based guard to ensure patch bumps with unchanged minAppVersion still get recorded"
  - "softprops/action-gh-release@v2 (not v3) — v3 requires Node 24 runtime not yet stable on GitHub-hosted runners"
  - "permissions: contents: write at job level only — minimum required for release creation, no write-all"

patterns-established:
  - "Release process: npm version patch -> git push -> git push --tags (triggers workflow)"
  - "Version files: all three (package.json, manifest.json, versions.json) updated atomically by npm version lifecycle"

requirements-completed: [REL-03]

# Metrics
duration: 2min
completed: 2026-04-13
---

# Phase 06 Plan 01: Release Tooling Summary

**Tag-triggered GitHub Actions workflow with softprops/action-gh-release@v2 and atomic npm version-bump script using key-based versions.json guard**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-13T03:42:07Z
- **Completed:** 2026-04-13T03:43:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- GitHub Actions workflow (.github/workflows/release.yml) that triggers on bare semver tags (e.g. 1.0.0), builds the plugin from source, and creates a GitHub release with auto-generated notes and all three required assets (main.js, manifest.json, styles.css)
- version-bump.mjs script invoked by npm version lifecycle that atomically updates manifest.json and versions.json using a key-based guard, ensuring patch bumps with unchanged minAppVersion are always recorded
- .npmrc enforcing tag-version-prefix="" so npm version creates bare 1.0.1 tags matching Obsidian community validator requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GitHub Actions release workflow** - `2bc0815` (feat)
2. **Task 2: Add version-bump script and npm version tooling** - `1074dcf` (feat)

## Files Created/Modified

- `.github/workflows/release.yml` - Tag-triggered CI workflow: checkout, Node 22 setup, npm build, softprops release with auto-notes and asset upload
- `version-bump.mjs` - Node ESM script: reads npm_package_version, writes manifest.json version, writes versions.json entry with key-guard
- `.npmrc` - Enforces tag-version-prefix="" for bare semver tags
- `package.json` - Added "version" lifecycle script: node version-bump.mjs && git add manifest.json versions.json

## Decisions Made

- **Bare semver tags (no v prefix):** Obsidian's community plugin submission validator requires the GitHub release tag to exactly match manifest.json's `version` field (e.g. `1.0.0` not `v1.0.0`). Used `[0-9]+.[0-9]+.[0-9]+*` trigger pattern and .npmrc `tag-version-prefix=""` to enforce this end-to-end.
- **Key-based versions.json guard:** Replaced the official sample plugin's `Object.values(versions).includes(minAppVersion)` check with `!versions[targetVersion]`. This ensures every patch bump gets an entry in versions.json, even when minAppVersion doesn't change between releases. The official check would silently skip patch entries sharing the same minAppVersion.
- **softprops/action-gh-release@v2 (not v3):** v3 was released April 2026 and requires Node 24 runtime — GitHub-hosted runners have not yet standardized on Node 24. v2 is stable and actively maintained.
- **permissions: contents: write at job level only:** Grants the minimum permission required for softprops/action-gh-release to create releases and upload assets. No write-all granted per T-06-02 threat mitigation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed Object.values reference from comment to pass verification**
- **Found during:** Task 2 verification
- **Issue:** Plan verification script checked `!script.includes('Object.values')` but the original comment text "deviates from the official sample plugin's Object.values check" caused a false failure
- **Fix:** Rephrased the comment to explain the deviation without using the literal string "Object.values"
- **Files modified:** version-bump.mjs
- **Verification:** All 9 version tooling checks PASS
- **Committed in:** 1074dcf (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - false-positive in comment text)
**Impact on plan:** Trivial rephrasing of documentation comment. No logic changes.

## Issues Encountered

None — plan executed cleanly. Both verification scripts (workflow checks and version tooling checks) passed on first attempt after the comment fix.

## User Setup Required

None — no external service configuration required. The workflow uses the default GITHUB_TOKEN scoped to the repository automatically by GitHub Actions.

**Developer release flow (for reference):**
```bash
npm version patch            # bumps package.json, runs version-bump.mjs, stages all 3 files, tags 1.0.1
git push && git push --tags  # triggers .github/workflows/release.yml
```

## Next Phase Readiness

- Release tooling is complete and ready for use
- Plugin is ready for community submission following the standard Obsidian release process
- Before first real tag push: verify workflow on a test tag (e.g. `0.9.9`) to confirm asset attachment works correctly in the GitHub Actions environment

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| .github/workflows/release.yml exists | FOUND |
| version-bump.mjs exists | FOUND |
| .npmrc exists | FOUND |
| package.json modified | FOUND |
| 06-01-SUMMARY.md exists | FOUND |
| commit 2bc0815 exists | FOUND |
| commit 1074dcf exists | FOUND |

---
*Phase: 06-release*
*Completed: 2026-04-13*
