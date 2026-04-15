---
phase: 08-security
reviewed: 2026-04-14T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/main.ts
  - src/api.ts
  - src/settings.ts
  - manifest.json
  - tests/api.test.ts
  - tests/command.test.ts
  - tests/main.test.ts
  - tests/settings.test.ts
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-14
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed four source files and four test files for the Obsidian Toggl Import plugin. The security posture is solid: the API token is correctly stored in `localStorage` (not `data.json`), is never reflected in error messages, and legacy plaintext tokens are migrated and purged on load. No injection vectors, no hardcoded secrets, and no XSS surfaces were found.

Three warnings were identified — all correctness issues rather than style preferences: a stale module-level project cache that is never invalidated between sessions, an unvalidated JSON response cast that silently accepts malformed API responses, and a test isolation gap where the project cache bleeds between test cases. Four informational items cover a loose `==` null check, a confusing-but-harmless settings merge order, a date boundary behavior that is worth documenting more prominently, and an empty `authorUrl` field.

---

## Warnings

### WR-01: Module-level project cache is never invalidated between sessions or workspace changes

**File:** `src/api.ts:51`

**Issue:** `projectCache` is a module-level variable initialized to `null` and populated on the first call to `loadProjectCache`. It is never cleared when the plugin unloads, when `workspaceId` changes, or when Obsidian reloads. Because esbuild bundles all modules into a single `main.js` evaluated once per Obsidian session, the cache can survive across plugin `onload`/`onunload` cycles if Obsidian hot-reloads the plugin without restarting. More critically, the cache is keyed by project ID globally with no association to which workspace it came from. If a user's `workspaceId` ever changes (e.g., on first import when it is auto-populated from `0`), the stale cache from an earlier workspace is silently used for the new workspace, returning wrong project names or empty strings for valid project IDs.

**Fix:** Associate the cache with the workspace ID it was loaded for, and invalidate on mismatch:

```typescript
let projectCache: { workspaceId: number; map: Map<number, string> } | null = null;

async function loadProjectCache(workspaceId: number, token: string): Promise<void> {
    if (projectCache !== null && projectCache.workspaceId === workspaceId) return;
    const projects = await togglGet<Array<{ id: number; name: string }>>(
        `${BASE}/workspaces/${workspaceId}/projects`,
        token,
    );
    projectCache = { workspaceId, map: new Map(projects.map(p => [p.id, p.name])) };
}

function resolveProject(projectId: number | null): string {
    if (projectId === null) return '';
    return projectCache?.map.get(projectId) ?? '';
}

export function _resetProjectCache(): void {
    projectCache = null;
}
```

---

### WR-02: Toggl API response cast has no runtime validation — malformed responses fail silently

**File:** `src/api.ts:26`

**Issue:** `return resp.json as T` is a TypeScript type assertion with zero runtime enforcement. If the Toggl API returns an unexpected shape — for example an error object like `{ error: "..." }` on a 200 response, or an empty body — the cast succeeds and downstream code receives `undefined` for expected fields. In `fetchTimeEntries`, `raw.filter(...)` would throw `TypeError: raw.filter is not a function` (if `raw` is not an array) surfacing as an unhandled error. In `loadProjectCache`, `projects.map(...)` would similarly throw. Neither produces a user-friendly message.

**Fix:** Add a minimal runtime shape guard before returning, or at the call sites that consume the result. The lightest-weight approach is a guard at the array call sites:

```typescript
// In fetchTimeEntries, after the togglGet call:
if (!Array.isArray(raw)) {
    throw new Error('Toggl API error: unexpected response format');
}

// In loadProjectCache, after the togglGet call:
if (!Array.isArray(projects)) {
    throw new Error('Toggl API error: unexpected projects response format');
}
```

---

### WR-03: Project cache is not reset between test cases — tests can bleed state

**File:** `tests/api.test.ts:59`

**Issue:** `beforeEach` calls `mockRequestUrl.mockReset()` to clear the HTTP mock, but never calls `_resetProjectCache()`. The module-level `projectCache` from `src/api.ts` persists across `it` blocks within the describe suite. This means tests that run after a successful cache-population call will skip the `/projects` endpoint entirely (the cache is warm), and tests that mock only specific endpoints may not reach their intended code path. For example, the "throws specific error on 401" tests (lines 148–184) set up a mock that returns 200 for `/projects` — but if the cache is already populated from an earlier test, the projects mock is never exercised and the test passes for an unintended reason.

**Fix:** Import `_resetProjectCache` and call it in `beforeEach`:

```typescript
import { fetchTimeEntries, TimeEntry, _resetProjectCache } from '../src/api';

// ...

describe('fetchTimeEntries', () => {
    beforeEach(() => {
        mockRequestUrl.mockReset();
        _resetProjectCache();   // ensure each test starts with a cold cache
    });
    // ...
});
```

---

## Info

### IN-01: Loose equality used for null check inconsistently with the rest of the file

**File:** `src/api.ts:99`

**Issue:** `e.stop == null` uses loose equality, which also matches `undefined`. `e.stop` is typed as `string | null`, so `undefined` is not a valid value per the type — `=== null` would be the precise check and matches the strict style used everywhere else in the file.

**Fix:**
```typescript
const completed = raw.filter(e => !(e.duration < 0 || e.stop === null));
```

---

### IN-02: Confusing (harmless) settings merge order in loadSettings

**File:** `src/main.ts:90`

**Issue:** The `Object.assign` call merges `this.settings ?? {}` as the middle layer, but `this.settings` is `undefined` at this point in `loadSettings` (it has not been assigned yet). The `?? {}` fallback makes this a no-op, but a future reader may misread this as "preserve in-memory settings across a reload," which it does not do. If `loadSettings` is ever called a second time (e.g., if Obsidian calls it again), the now-assigned `this.settings` would sit between `DEFAULT_SETTINGS` and `raw`, causing persisted data to be masked by stale in-memory state.

**Fix:** Remove the redundant middle spread:
```typescript
this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
```

---

### IN-03: Date boundary behavior (local midnight) is not prominent in user-facing documentation

**File:** `src/api.ts:89`

**Issue:** `new Date(date + 'T00:00:00').toISOString()` constructs the time window using **local midnight**, not UTC midnight. This is by design (comment references D-01) and means the Toggl query window aligns with the user's local day. However, a user in UTC+10 importing entries for `2024-06-15` will send `start_date=2024-06-14T14:00:00Z` to Toggl. Entries that started before local midnight on the 15th but after UTC midnight will be missed; entries from the local 16th may be included. This is correct behavior for a daily-note plugin, but the tradeoff is not documented anywhere the user would see it (e.g., settings tab or plugin description).

**Fix:** No code change required. Consider adding a one-line note to the settings tab description or plugin README clarifying that import boundaries follow the local system clock.

---

### IN-04: manifest.json has an empty authorUrl field

**File:** `manifest.json:8`

**Issue:** `"authorUrl": ""` is an empty string. The Obsidian plugin registry uses this field to link to the author's profile. An empty string is valid JSON but will produce a broken link if the plugin is ever submitted to the community registry.

**Fix:** Either populate with a GitHub profile URL or remove the field entirely (it is optional):
```json
"authorUrl": "https://github.com/your-username"
```

---

_Reviewed: 2026-04-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
