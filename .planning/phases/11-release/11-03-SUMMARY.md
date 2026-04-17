---
phase: 11-release
plan: "03"
subsystem: settings, api, ui
tags: [day-wrap-time, filter, settings, night-owl]
dependency_graph:
  requires: ["11-01"]
  provides: ["dayWrapTime setting", "client-side entry filter"]
  affects: ["src/main.ts", "src/api.ts", "src/settings.ts", "tests/api.test.ts"]
tech_stack:
  added: []
  patterns: ["client-side filter with fast-path no-op", "local time via Date.getHours()"]
key_files:
  created: []
  modified:
    - src/main.ts
    - src/api.ts
    - src/settings.ts
    - tests/api.test.ts
decisions:
  - "Use wrapMinutes === 0 fast path so default '00:00' has zero overhead"
  - "Use new Date(e.start).getHours()/getMinutes() for local timezone comparison (no library needed)"
  - "No input validation in settings — NaN handled safely by ?? 0 fallback in api.ts"
metrics:
  duration_minutes: 10
  completed_date: "2026-04-17"
  tasks_completed: 4
  files_modified: 4
---

# Phase 11 Plan 03: Day Wrap Time Filter Summary

**One-liner:** Client-side day wrap time filter using local `Date` hours/minutes with `'00:00'` no-op fast path for night-owl users.

## Objective

Added a "Day wrap time" setting (HH:MM, default "00:00") that excludes completed time entries whose local start time falls before the configured boundary. Night-owl users who work past midnight (e.g. 01:00–03:59) can configure 04:00 so those entries attribute to the previous day's note rather than the new one.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add dayWrapTime to settings interface and defaults | 7e186c3 | src/main.ts |
| 2 | Implement filter in fetchTimeEntries | ff8de13 | src/api.ts |
| 3 | Add Day wrap time field to settings UI | 52ef575 | src/settings.ts |
| 4 | Add tests for day wrap time filter | 8bc2984 | tests/api.test.ts |

## Implementation Details

### src/main.ts
- Added `dayWrapTime: string` to `TogglImportSettings` interface after `sortOrder`
- Added `dayWrapTime: '00:00'` to `DEFAULT_SETTINGS` after `sortOrder`

### src/api.ts
- After the running-entry filter (`completed`), computes `wrapMinutes` from `dayWrapTime.split(':').map(Number)`
- Fast path: when `wrapMinutes === 0`, assigns `wrapped = completed` with no iteration
- Filter path: `new Date(e.start).getHours() * 60 + getMinutes() >= wrapMinutes` using local timezone
- Sort and map now operate on `wrapped` instead of `completed`

### src/settings.ts
- New `Setting` for "Day wrap time" inserted between Sort order and Columns heading
- Text input with placeholder `'00:00'`, saves via `plugin.saveSettings()` on change

### tests/api.test.ts
- `createMockPlugin` updated to accept and include `dayWrapTime` in settings (default `'00:00'`)
- New `describe` block with 3 tests:
  - Default `'00:00'` does not filter any entries (no-op)
  - `'23:00'` filters all SORT_TEST_ENTRIES (start at 08:00, 11:00, 14:00 UTC — none reach 23:00 local)
  - `'00:01'` keeps all entries (all start well after 00:01 local)

## Verification

- `npx tsc --noEmit` exits 0
- `npm run build` exits 0 (8.2kb bundle)
- `npm test` — 79/79 tests pass (76 existing + 3 new)
- `grep -q "dayWrapTime" src/main.ts src/settings.ts src/api.ts tests/api.test.ts` exits 0

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced. All changes are client-side filtering of already-fetched data.

## Self-Check: PASSED

Files verified:
- FOUND: src/main.ts (contains dayWrapTime)
- FOUND: src/api.ts (contains dayWrapTime filter logic)
- FOUND: src/settings.ts (contains Day wrap time Setting)
- FOUND: tests/api.test.ts (contains dayWrapTime test describe)

Commits verified:
- FOUND: 7e186c3 feat(11-03): add dayWrapTime to settings interface and defaults
- FOUND: ff8de13 feat(11-03): implement day wrap time filter in fetchTimeEntries
- FOUND: 52ef575 feat(11-03): add Day wrap time text input to settings UI
- FOUND: 8bc2984 test(11-03): add day wrap time filter tests
