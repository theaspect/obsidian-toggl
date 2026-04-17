---
phase: 11-release
fixed_at: 2026-04-17T12:30:00Z
review_path: .planning/phases/11-release/11-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-04-17T12:30:00Z
**Source review:** .planning/phases/11-release/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (WR-01, WR-02, WR-03 — no Critical findings)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: `togglGet` null guard for empty response body

**Files modified:** `src/api.ts`
**Commit:** 6709d3b
**Applied fix:** Added `if (resp.json == null)` check after the HTTP status checks in `togglGet`. When a 2xx response has a null JSON body, the function now throws `Toggl API error: empty response body (${resp.status})` instead of silently passing `null` to callers where a property access would produce an unhelpful TypeError.

---

### WR-02: `loadProjectCache` array guard before `.map()`

**Files modified:** `src/api.ts`
**Commit:** 121b623
**Applied fix:** Added `if (!Array.isArray(projects))` check after `togglGet` returns in `loadProjectCache`. When the projects endpoint returns a non-array body (e.g., a permission error object that arrives with a 200 status), the function now throws `Toggl API error: unexpected response from projects endpoint` instead of crashing with `TypeError: projects.map is not a function`.

---

### WR-03: `_resetProjectCache()` called in `beforeEach` for both describe blocks

**Files modified:** `tests/api.test.ts`
**Commit:** b1d8895
**Applied fix:** Added `_resetProjectCache` to the import from `../src/api`, then added `_resetProjectCache()` calls inside the `beforeEach` of both `describe('fetchTimeEntries')` and `describe('fetchTimeEntries — day wrap time filter')`. This ensures the module-level project cache is cleared before every test, eliminating hidden test-order coupling where later tests silently inherited cached project data from the first test that ran.

---

_Fixed: 2026-04-17T12:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
