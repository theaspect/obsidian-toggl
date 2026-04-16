---
phase: 10-formatting
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/formatter.ts
  - src/main.ts
  - src/settings.ts
  - tests/formatter.test.ts
  - tests/settings.test.ts
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-16
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the formatting implementation (template engine, column filtering, table/plaintext/template output modes), the main plugin entry point, the settings tab, and the associated test suites.

The formatting logic is well-structured and the column-ordering approach is clean. The test coverage for `formatEntries` is thorough. One critical security issue exists in `renderTemplate`: it uses `new Function` to evaluate user-supplied template strings in Electron's full-privilege context. Four warnings cover a placeholder-collision bug, misleading behavior on unknown output formats, an overly broad `saveSettings` call on every startup, and an incomplete settings stub in tests. Four informational items cover minor code quality concerns.

---

## Critical Issues

### CR-01: `renderTemplate` executes arbitrary JavaScript via `new Function`

**File:** `src/formatter.ts:59`

**Issue:** The `renderTemplate` function constructs and calls `new Function(...)` with a body derived directly from `settings.templateString`. In Electron (Obsidian's runtime), `new Function` has access to the full Node.js global scope — `require`, `process`, `fs`, etc. — not just a sandboxed browser context. While `templateString` is written by the local vault owner through the settings UI, Obsidian vaults are frequently shared (e.g., via Obsidian Sync, git, or shared drives). A vault owner or contributor who plants a malicious `data.json` can execute arbitrary code on any machine that opens the vault.

Example payload in `data.json`:
```json
{
  "templateString": "${description}${(()=>{require('child_process').execSync('calc.exe')})()}"
}
```

This executes `calc.exe` (or any command) silently when the user runs the import command.

**Fix:** Replace `new Function` with a simple regex-based variable substitution. The template syntax only needs to support `${varname}` with optional `?? 'fallback'` or `|| 'fallback'` suffixes. A recursive replace with a safe lookup is sufficient and eliminates arbitrary execution entirely:

```typescript
function renderTemplate(template: string, vars: Record<string, string | null>): string {
    const KNOWN_VARS = ['description', 'start', 'duration', 'tags', 'project'];
    return template.replace(/\$\{([^}]+)\}/g, (_match, expr: string) => {
        const trimmed = expr.trim();

        // ${varname ?? 'fallback'} or ${varname || 'fallback'}
        const nullCoalMatch = trimmed.match(/^(\w+)\s*\?\?\s*['"]([^'"]*)['"]\s*$/);
        if (nullCoalMatch) {
            const [, name, fallback] = nullCoalMatch;
            if (KNOWN_VARS.includes(name)) {
                const val = vars[name];
                return (val === null || val === '') ? fallback : val;
            }
        }
        const orMatch = trimmed.match(/^(\w+)\s*\|\|\s*['"]([^'"]*)['"]\s*$/);
        if (orMatch) {
            const [, name, fallback] = orMatch;
            if (KNOWN_VARS.includes(name)) {
                const val = vars[name];
                return (val === null || val === '') ? fallback : val;
            }
        }

        // ${varname} bare reference
        if (KNOWN_VARS.includes(trimmed)) {
            return vars[trimmed] ?? '';
        }

        // Unknown variable — pass through literally
        return `\${${expr}}`;
    });
}
```

This supports all three documented template patterns (`${var}`, `${var ?? 'x'}`, `${var || 'x'}`) without executing code.

---

## Warnings

### WR-01: Placeholder restore uses `replace` — only first occurrence replaced

**File:** `src/formatter.ts:63-65`

**Issue:** The unknown-token restore loop calls `result.replace(key, original)`. `String.prototype.replace` with a string argument replaces only the first match. If the same unknown variable appears twice in a template (e.g., `${foo} and ${foo}`), both occurrences get separate `__PLACEHOLDER_N__` keys (because `idx` increments), so in practice they always differ. However, if `idx` ever resets or two separate templates share state, this would silently leave placeholder tokens in output. More immediately: if the _evaluated_ template string happens to contain the placeholder text (unlikely but possible via description/project field values), `replace` would corrupt it.

Note: This warning is rendered moot if CR-01 is fixed by replacing `new Function` entirely.

**Fix:**
```typescript
result = result.replaceAll(key, original);
```

---

### WR-02: `formatEntries` silently returns `''` for unrecognized `outputFormat`

**File:** `src/formatter.ts:108`

**Issue:** The `if/else if/else if` chain at lines 80-107 has no `else` branch for an unrecognized format value. The fallthrough `return ''` at line 108 means that if `settings.outputFormat` is ever set to an unexpected value (e.g., a stale value from a previous plugin version or a corrupted `data.json`), `formatEntries` returns `''` and `main.ts` line 77-79 shows "No entries found for this date." — even though entries were successfully fetched. The user gets a misleading message with no indication that the format setting is the problem.

**Fix:** Add an explicit guard or exhaustiveness check:
```typescript
// After the else-if chain:
// This branch should never be reached with valid settings
new Notice(`Unknown output format: "${settings.outputFormat}". Check plugin settings.`);
return '';
```

Or enforce exhaustiveness at the TypeScript level by assigning the format to `never`:
```typescript
} else {
    const _exhaustive: never = settings.outputFormat;
    return '';
}
```

---

### WR-03: `loadSettings` calls `saveSettings` unconditionally on every plugin load

**File:** `src/main.ts:91-98`

**Issue:** `loadSettings` always calls `await this.saveSettings()` at line 98, even when no migration was needed. The comment says "Persist sanitized form so data.json no longer carries the legacy field," but the `delete` on line 94 only runs when `'apiToken' in raw` is true. If the legacy field is absent (the common case for new installs and already-migrated vaults), `saveSettings` still writes `data.json` on every startup. This is unnecessary disk I/O and would overwrite any manual edits to `data.json` the user might make between restarts.

**Fix:** Persist only when migration actually occurred:
```typescript
async loadSettings(): Promise<void> {
    const raw = (await this.loadData()) ?? {};
    let needsMigration = false;
    if (raw && typeof raw === 'object' && 'apiToken' in raw) {
        delete (raw as Record<string, unknown>).apiToken;
        needsMigration = true;
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
    if (needsMigration) {
        await this.saveSettings();
    }
}
```

Note: The fix also removes the redundant `this.settings ?? {}` in position 3 of `Object.assign` (see WR-04).

---

### WR-04: `loadSettings` merge includes `this.settings` as a source — redundant and confusing

**File:** `src/main.ts:96`

**Issue:** `Object.assign({}, DEFAULT_SETTINGS, this.settings ?? {}, raw)` spreads `this.settings` as the third source. At the time `loadSettings` is called (during `onload`), `this.settings` is declared with `!` but has no assigned value — TypeScript non-null assertion does not initialize the field. In JavaScript, an uninitialized class field is `undefined`, so `this.settings ?? {}` evaluates to `{}` and spreads nothing — it is harmless. However, if `loadSettings` were ever called a second time after `this.settings` was populated, `this.settings` in position 3 would override `raw` (position 4) for any keys that exist in `this.settings` but not in `raw`. This inversion of expected merge priority is a latent bug.

**Fix:** Remove the redundant source:
```typescript
this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
```

`Object.assign` already handles partial `raw` objects correctly — missing keys fall back to `DEFAULT_SETTINGS` values.

---

### WR-05: Test settings stub missing `templateString` field — incomplete type coverage

**File:** `tests/settings.test.ts:103-107`

**Issue:** The `makeTab()` plugin stub at line 99-112 declares `settings` without `templateString` or `sortOrder`. The stub is typed `as any`, silencing TypeScript. Any test that calls `tab.display()` with `outputFormat: 'template'` would cause `settings.templateString` to evaluate as `undefined`, silently rendering a broken template input (the `addTextArea` mock's `setValue` would receive `undefined`). If the settings test suite is expanded to cover template-format UI, this stub will produce misleading test behavior rather than a clear failure.

**Fix:** Add the missing fields to the stub:
```typescript
settings: {
    outputFormat: 'table' as const,
    columns: { description: true, startTime: true, duration: true, tags: false, project: false },
    delimiter: '|',
    templateString: '${description} (${duration})',
    sortOrder: 'asc' as const,
    workspaceId: 42,
},
```

---

## Info

### IN-01: `formatDuration` has no guard for negative input

**File:** `src/formatter.ts:4-9`

**Issue:** `formatDuration` is an exported function. When called with a negative `secs` value (as Toggl uses for running/in-progress entries), it produces malformed output like `-1h 30m` because `Math.floor(-5400 / 3600) = -2` and `Math.floor((-5400 % 3600) / 60) = 30`. The `api.ts` layer filters running entries before they reach `formatEntries`, but since `formatDuration` is directly exported and tested, a caller bypassing the API layer could silently receive bad output.

**Fix:** Add an early guard:
```typescript
export function formatDuration(secs: number): string {
    if (secs <= 0) return '0m';
    // ... existing logic
}
```

A test covering `formatDuration(-5400)` should be added alongside it.

---

### IN-02: No test coverage for duplicate unknown variables in template

**File:** `tests/formatter.test.ts`

**Issue:** The test suite covers single unknown variable passthrough (`${foo} ${description}`) but not the case where the same unknown variable appears multiple times (e.g., `${foo} and ${foo}`). This is the scenario that would expose the `replace` vs `replaceAll` issue noted in WR-01. If CR-01 is addressed by switching away from `new Function`, ensure that the replacement implementation is tested for this case.

**Fix:** Add a test:
```typescript
it('unknown variable appears twice — both occurrences pass through literally', () => {
    const settings = makeSettings({
        outputFormat: 'template',
        templateString: '${foo} and ${foo}',
    });
    const output = formatEntries([makeEntry()], settings);
    expect(output).toBe('${foo} and ${foo}');
});
```

---

### IN-03: `settings.ts` column toggles are disabled in template mode but provide no visual hint

**File:** `src/settings.ts:122-135`

**Issue:** Column toggles are `setDisabled(isTemplate)` when template mode is active, which is correct. However, there is no `setDesc` or tooltip explaining _why_ they are disabled. A user who selects template mode and sees greyed-out toggles has no in-UI explanation. This is a UX gap rather than a code bug, but it could cause support confusion.

**Fix:** Add a description to the Columns heading or individual toggles when disabled:
```typescript
new Setting(containerEl)
    .setName('Columns')
    .setDesc(isTemplate ? 'Column toggles are not used in template mode.' : '')
    .setHeading();
```

---

### IN-04: Commented-out code pattern risk — `formatEntries` returns `''` at line 108 without comment

**File:** `src/formatter.ts:108`

**Issue:** The bare `return ''` at line 108 (the final fallthrough of the format chain) has no comment. A future maintainer adding a new format option might miss that this line exists and assume the function always terminates in one of the named branches. This contributes to the risk described in WR-02.

**Fix:** Add a comment:
```typescript
// Unreachable with valid settings — exhaustiveness guard above should fire first
return '';
```

---

_Reviewed: 2026-04-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
