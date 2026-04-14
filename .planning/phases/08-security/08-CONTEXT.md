# Phase 8: Security - Context

**Gathered:** 2026-04-14 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a "Test connection" button to the settings tab (SEC-01) and move API token storage from plaintext `data.json` to Obsidian localStorage (SEC-02). No migration of existing tokens — treat as a fresh install. All existing tests must pass after refactor.

</domain>

<decisions>
## Implementation Decisions

### Test Connection Button (SEC-01)
- **D-01:** Add a "Test connection" button to the settings tab, positioned immediately after the API token field
- **D-02:** On click: call `togglGet()` (reuse existing helper from `api.ts`) against `GET /me`; show a Notice with the result
- **D-03:** Success notice: `"Connected as [fullname]"` — use the `fullname` field from the `/me` response
- **D-04:** Failure notices mirror existing api.ts error messages: `"Toggl API error: invalid API token (401)"`, `"Toggl API error: network request failed"`, etc.
- **D-05:** Button is disabled (greyed out) while the request is in flight; re-enabled after response

### Token Storage (SEC-02)
- **D-06:** API token is stored via `Plugin.loadLocalStorage('toggl-api-token')` / `Plugin.saveLocalStorage('toggl-api-token', value)` — device-local, not included in Obsidian Sync
- **D-07:** `apiToken` is removed from `TogglImportSettings` interface and from `data.json` storage entirely
- **D-08:** Plugin exposes `async getApiToken(): Promise<string>` method that reads from localStorage — used by `api.ts` and the settings tab
- **D-09:** No migration path — no existing tokens to preserve; users re-enter their token after upgrading

### Settings Tab Description
- **D-10:** Token field description updated to: `"Stored locally on this device — not synced to Obsidian Sync"`

### Token Access in api.ts
- **D-11:** `fetchTimeEntries` and `togglGet` receive the token string as a parameter (already the case for `togglGet`); `fetchTimeEntries` calls `await plugin.getApiToken()` instead of reading `plugin.settings.apiToken`
- **D-12:** Empty-token guard in `main.ts` updated to call `await this.getApiToken()` and check for empty string

### Claude's Discretion
- Button loading state implementation detail (CSS class, spinner vs text change)
- Exact placement within the Setting row (addButton vs standalone Setting)
- localStorage key name convention (use `'toggl-api-token'` as established in D-06)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §SEC-01, §SEC-02 — acceptance criteria for this phase

### Existing code to refactor
- `src/settings.ts` — token field (line 16-27), full display() method; add button after token field
- `src/main.ts` — `TogglImportSettings` interface (line 6-18), `loadSettings` (line 82-89), empty-token guard (line 44-48); remove `apiToken` from interface, add `getApiToken()` method
- `src/api.ts` — `fetchTimeEntries` reads `plugin.settings.apiToken` (line 72); update to `await plugin.getApiToken()`

### Test files
- `tests/api.test.ts` — mocks `plugin.settings.apiToken`; update to mock `plugin.getApiToken()`
- `tests/command.test.ts` — same apiToken mock pattern

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `togglGet<T>(url, token)` in `api.ts:10` — already accepts token as a string parameter; can be called directly from the test-connection button handler with the current input value
- `authHeader(token)` in `api.ts:6` — same, reusable
- `Plugin.loadLocalStorage(key)` / `Plugin.saveLocalStorage(key, value)` — built into Obsidian's Plugin base class; no imports needed

### Established Patterns
- Settings tab uses `new Setting(containerEl).addButton(...)` pattern — consistent with how other settings rows are built
- Notices use `new Notice('message')` — already imported in `main.ts:1`
- Error messages follow `'Toggl API error: [description]'` format throughout `api.ts`

### Integration Points
- `main.ts:44` — empty-token guard needs updating from `settings.apiToken === ''` to `(await this.getApiToken()) === ''`
- `api.ts:72` — `const token = plugin.settings.apiToken` → `const token = await plugin.getApiToken()`
- `tests/api.test.ts` and `tests/command.test.ts` — mock setup needs updating to stub `getApiToken()` instead of setting `settings.apiToken`

</code_context>

<specifics>
## Specific Ideas

- No migration from old data.json tokens — treat as fresh install; users re-enter token
- `getApiToken()` is async because `loadLocalStorage` may be async in some Obsidian versions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-security*
*Context gathered: 2026-04-14*
