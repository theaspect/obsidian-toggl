---
phase: 09-import-behavior
plan: 01
subsystem: api
tags: [typescript, vitest, toggl-api, settings, tdd]

# Dependency graph
requires:
  - phase: 08-security
    provides: getApiToken() async method, TogglImportSettings interface, fetchTimeEntries function
provides:
  - sortOrder: 'asc' | 'desc' setting in TogglImportSettings with default 'asc'
  - fetchTimeEntries sorts completed entries by ISO start string before returning
  - Import command accepts yyyy-mm-dd prefix filenames (e.g. "2026-12-31 Daily Note")
  - Sort order dropdown in settings tab (Ascending/Descending)
affects: [10-registry-prep, any phase touching fetchTimeEntries or command handler]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prefix regex /^(\\d{4}-\\d{2}-\\d{2})/ + captured group for flexible filename parsing"
    - "Sort by ISO string localeCompare — safe for UTC+offset strings"
    - "TDD RED->GREEN: failing tests committed before implementation"

key-files:
  created: []
  modified:
    - src/api.ts
    - src/main.ts
    - src/settings.ts
    - tests/api.test.ts
    - tests/command.test.ts

key-decisions:
  - "Sort applied inside fetchTimeEntries before returning — callers always get sorted results (D-01)"
  - "sortOrder: 'asc' | 'desc' in TogglImportSettings, default 'asc' (D-02)"
  - "Prefix regex replaces exact match — /^(\\d{4}-\\d{2}-\\d{2})/ captures date group (D-04)"
  - "dateMatch[1] asserted as string (TS2345) — guard !dateMatch above guarantees non-undefined"

patterns-established:
  - "Filename date extraction: match prefix then use captured group, not full basename"
  - "Sort direction: ternary on === 'desc' defaulting to ascending for any other value (T-09-03 mitigation)"

requirements-completed: [IMP-01, IMP-02]

# Metrics
duration: 12min
completed: 2026-04-15
---

# Phase 09 Plan 01: Import Behavior Summary

**Configurable asc/desc sort in fetchTimeEntries and prefix-based date parsing in the import command, enabling filenames like "2026-12-31 Daily Note.md"**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-15T23:26:00Z
- **Completed:** 2026-04-15T23:38:00Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 5

## Accomplishments

- IMP-01: `fetchTimeEntries` now sorts completed entries by ISO start string; direction controlled by `plugin.settings.sortOrder` ('asc' default, 'desc' for newest-first)
- IMP-02: Import command accepts any filename starting with yyyy-mm-dd (e.g. "2026-12-31 Daily Note") by replacing exact regex with prefix capture
- Settings tab gains a Sort order dropdown with "Ascending (oldest first)" and "Descending (newest first)" options
- 66 tests pass (17 new tests added: 3 sort order + 3 prefix filename + updates to 2 CMD-03 assertions + 1 settings update)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for IMP-01 sort and IMP-02 prefix filename** - `a2e2b0c` (test)
2. **Task 2: Implement IMP-01 and IMP-02 to make tests pass** - `1316e76` (feat)

_Note: TDD tasks have two commits — RED (failing tests) then GREEN (implementation)_

## Files Created/Modified

- `src/api.ts` - Added IMP-01 sort block after filtering; reads `plugin.settings.sortOrder`
- `src/main.ts` - Added `sortOrder` to interface and DEFAULT_SETTINGS; replaced exact regex with prefix capture; updated error notice text; passes captured date group to fetchTimeEntries
- `src/settings.ts` - Added Sort order dropdown (addDropdown) after delimiter block, before Columns heading
- `tests/api.test.ts` - Updated createMockPlugin factory with sortOrder override; added SORT_TEST_ENTRIES; added 3 sort order tests
- `tests/command.test.ts` - Added sortOrder to loadPluginAndGetCallback settings; updated 2 CMD-03 assertions to new D-06 error text; added 3 IMP-02 prefix tests

## Decisions Made

- `dateMatch[1]` cast as `string` (`as string`) to resolve TS2345 — the `!dateMatch` guard above makes `[1]` guaranteed non-undefined at that point; TypeScript's array index narrowing doesn't flow through the guard automatically
- Sort uses `localeCompare` on ISO strings — safe because UTC+offset strings sort lexicographically correctly for same-day entries

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TS2345 type error: dateMatch[1] is string | undefined**
- **Found during:** Task 2 (implement GREEN)
- **Issue:** `npm run build` failed with `TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'` on the `dateMatch[1]` captured group, even though the `!dateMatch` guard guarantees non-null
- **Fix:** Added `as string` assertion: `const date = dateMatch[1] as string;`
- **Files modified:** `src/main.ts`
- **Verification:** `npm run build` exits 0, `npm test` 66/66 pass
- **Committed in:** `1316e76` (Task 2 feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type narrowing bug)
**Impact on plan:** Minimal — one-line type assertion. No scope change.

## Issues Encountered

None beyond the TS2345 fix documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- IMP-01 and IMP-02 fully implemented and tested; ready for phase 10 (registry prep)
- Sort order persists via `data.json` through existing `saveSettings()` mechanism
- No blockers

---
*Phase: 09-import-behavior*
*Completed: 2026-04-15*
