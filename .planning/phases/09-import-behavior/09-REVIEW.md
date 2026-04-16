---
phase: 09-import-behavior
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/api.ts
  - src/main.ts
  - src/settings.ts
  - tests/api.test.ts
  - tests/command.test.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-04-16
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed five source files implementing IMP-01 (configurable sort order) and IMP-02 (date-prefix filename parsing). Both features are implemented correctly and are well-tested. The primary concerns are:

1. A logic bug in date boundary construction that can pull in wrong-day entries for users in non-UTC timezones.
2. A module-level project cache that is never invalidated when the workspace changes mid-session, and is not reset between test runs.
3. Test infrastructure gaps: the project cache reset helper (`_resetProjectCache`) exists but is never called in `beforeEach`, making the test suite order-dependent.
4. A misleading (though harmless) settings merge order in `loadSettings`.

No security vulnerabilities were found. The settings UI and API token handling are correct.

---

## Warnings

### WR-01: Date boundaries use local midnight — entries may bleed across UTC day boundaries

**File:** `src/api.ts:89-90`
**Issue:** `new Date(date + 'T00:00:00')` and `new Date(date + 'T23:59:59')` parse as **local time** on Node/Electron, then `.toISOString()` converts to UTC. The Toggl API filters by the UTC `start` timestamp of each time entry. For a user in UTC+5, their "local midnight" is 19:00 UTC the prior day — so the `start_date` query parameter will include entries that started on the previous UTC calendar day. For a user in UTC-5, entries logged before 05:00 UTC on the target day are excluded. The comment "local midnight -> UTC" accurately describes the behavior, but the behavior itself is incorrect for the use case: users expect to see entries they logged on that calendar date in their local timezone.

**Fix:**
```typescript
// Construct boundaries in the user's local timezone
// new Date('yyyy-mm-ddT00:00:00') already parses as local — keep that.
// However, the Toggl API accepts RFC 3339. To ensure the query window matches
// the user's local day, pass the offset explicitly:
function localDateBoundaries(date: string): { start: string; end: string } {
    const offsetMs = new Date().getTimezoneOffset() * 60 * 1000; // negative for UTC+
    const offsetSign = offsetMs <= 0 ? '+' : '-';
    const absOffsetMin = Math.abs(new Date().getTimezoneOffset());
    const hh = String(Math.floor(absOffsetMin / 60)).padStart(2, '0');
    const mm = String(absOffsetMin % 60).padStart(2, '0');
    const tz = `${offsetSign}${hh}:${mm}`;
    return {
        start: `${date}T00:00:00${tz}`,
        end:   `${date}T23:59:59${tz}`,
    };
}
// Then in fetchTimeEntries:
const { start, end } = localDateBoundaries(date);
```

Alternatively, if UTC-day semantics are intentional (show all entries that started within the UTC day matching the filename), document that clearly and align user expectations in the notice/settings text.

---

### WR-02: Module-level projectCache is never invalidated on workspace change

**File:** `src/api.ts:51-65`
**Issue:** `projectCache` is a module-level singleton that is populated once (`if (projectCache !== null) return`) and never cleared when `plugin.settings.workspaceId` changes. If a user changes their workspace ID in settings mid-session, subsequent imports will use the project names from the old workspace. In practice this is unlikely in single-workspace use, but the cache has no workspace-ID key — it just stores whatever was fetched first.

**Fix:**
```typescript
let projectCache: Map<number, string> | null = null;
let cachedWorkspaceId: number | null = null;

async function loadProjectCache(workspaceId: number, token: string): Promise<void> {
    if (projectCache !== null && cachedWorkspaceId === workspaceId) return;
    const projects = await togglGet<Array<{ id: number; name: string }>>(
        `${BASE}/workspaces/${workspaceId}/projects`,
        token,
    );
    projectCache = new Map(projects.map(p => [p.id, p.name]));
    cachedWorkspaceId = workspaceId;
}

// Also update _resetProjectCache:
export function _resetProjectCache(): void {
    projectCache = null;
    cachedWorkspaceId = null;
}
```

---

### WR-03: `_resetProjectCache()` is never called in test `beforeEach` — test suite is order-dependent

**File:** `tests/api.test.ts:65-68`
**Issue:** The module-level `projectCache` is populated by the first test that calls `fetchTimeEntries` and is never cleared between tests. The `_resetProjectCache` export exists specifically for this purpose but is not imported or called in `beforeEach`. If test execution order changes (e.g., vitest parallelism, `.only` isolation, random ordering), tests that depend on a specific `project_name` may receive stale cache data from an earlier test run with different mock project data.

**Fix:**
```typescript
import { fetchTimeEntries, TimeEntry, _resetProjectCache } from '../src/api';

// ...

describe('fetchTimeEntries', () => {
    beforeEach(() => {
        mockRequestUrl.mockReset();
        _resetProjectCache(); // clear module-level cache between tests
    });
    // ...
});
```

---

### WR-04: `plugin.settings` manual assignment in test is overwritten by `onload()` / `loadSettings()`

**File:** `tests/command.test.ts:53-66`
**Issue:** `loadPluginAndGetCallback()` sets `plugin.settings` at lines 53-65, then calls `await plugin.onload()` at line 66. `onload()` invokes `loadSettings()`, which unconditionally overwrites `plugin.settings` via `Object.assign`. The manually assigned settings (including `sortOrder: 'asc'`) are replaced. The tests pass only because `DEFAULT_SETTINGS` happens to have the same values. If `DEFAULT_SETTINGS` changes (e.g., `sortOrder` defaults to `'desc'`), tests that rely on the pre-set values will silently use the wrong settings.

**Fix:** Move the settings assignment to after `onload()`, or override specific settings after the call:
```typescript
async function loadPluginAndGetCallback() {
    const plugin = new TogglImportPlugin();
    await plugin.onload();  // loadSettings runs here and sets defaults
    // Override settings AFTER onload so they aren't clobbered:
    plugin.settings.sortOrder = 'asc';
    plugin.settings.workspaceId = 42;
    (plugin as any).getApiToken = vi.fn().mockResolvedValue('token');
    // ...
}
```

---

## Info

### IN-01: loadSettings merges `this.settings` (always undefined on first call) into Object.assign

**File:** `src/main.ts:94`
**Issue:** `Object.assign({}, DEFAULT_SETTINGS, this.settings ?? {}, raw)` includes `this.settings ?? {}` as a middle layer. On first load, `this.settings` is `undefined` (the `!` non-null assertion does not initialize the field), so `this.settings ?? {}` evaluates to `{}`. The merge produces no bug today, but the intent — "preserve an existing in-memory value" — can never be satisfied on first load. The pattern is misleading.

**Fix:** Simplify the merge to the two meaningful layers:
```typescript
this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
```

---

### IN-02: Loose equality `== null` in running-entry filter

**File:** `src/api.ts:99`
**Issue:** `e.stop == null` uses loose equality, which matches both `null` and `undefined`. `stop` is typed as `string | null`, so `undefined` cannot appear — but in strict TypeScript the `==` form is sometimes flagged by linters as inconsistent with the rest of the codebase which uses `===` throughout.

**Fix:**
```typescript
const completed = raw.filter(e => !(e.duration < 0 || e.stop === null));
```

---

### IN-03: Redundant check — `raw &&` guard in loadSettings before `typeof` check

**File:** `src/main.ts:91`
**Issue:** `if (raw && typeof raw === 'object' && 'apiToken' in raw)` — the `raw &&` check is redundant because `typeof raw === 'object'` already excludes falsy primitives (it is false for `null` in strict mode: `typeof null === 'object'` is true, but `null && ...` short-circuits). Actually `typeof null === 'object'` would evaluate to true for `null`, making the `raw &&` check load-bearing. This is fine but the pattern is a common source of confusion. Consider a more explicit null guard:

**Fix:**
```typescript
if (raw !== null && typeof raw === 'object' && 'apiToken' in raw) {
```

---

### IN-04: Test for "skips /me call" may not verify the right behavior if URL matching is ambiguous

**File:** `tests/api.test.ts:215-224`
**Issue:** The assertion `call[0].url.endsWith('/me')` in the "skips /me call" test would also match a hypothetical future endpoint path like `/workspaces/42/me`. The current endpoints (`/me` and `/me/time_entries`) make this safe today, but the matcher is fragile.

**Fix:** Use a more precise match to avoid accidental future collisions:
```typescript
const meCall = mockRequestUrl.mock.calls.find(
    (call: any[]) => call[0].url === `${BASE}/me`
);
```

---

_Reviewed: 2026-04-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
