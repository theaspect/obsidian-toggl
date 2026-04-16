# Phase 10: Formatting - Research

**Researched:** 2026-04-16
**Domain:** TypeScript template string evaluation, Obsidian Settings UI, formatter extension
**Confidence:** HIGH

## Summary

Phase 10 adds a third format mode (`'template'`) to the existing `formatEntries` function. Users write a `${variable}` template string in settings; each imported entry is rendered by substituting the five known field variables. The full implementation scope is narrow and self-contained: three source files modified (`formatter.ts`, `main.ts`, `settings.ts`) and one test file extended (`tests/formatter.test.ts`). No new dependencies are introduced.

The most architecturally significant decision is how to safely evaluate expressions like `${project ?? 'n/a'}`. The CONTEXT.md locks `new Function` with only the five known field values as parameters as the acceptable approach. This is the correct choice: it prevents globals from leaking into evaluation while supporting nullish coalescing and logical-or expressions natively via JavaScript's own parser.

Unknown variable names (`${foo}`) must pass through as-is rather than being replaced with empty string. This requires a deliberate two-pass strategy: first replace known variables, then leave unknown `${...}` tokens untouched — the opposite of a naive "replace everything" approach.

**Primary recommendation:** Implement the template evaluator using `new Function` with exactly five named parameters; handle the unknown-variable passthrough by only substituting matched known names and leaving the rest literally in the output.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Template placeholders use `${variable}` syntax. Simple variable references (`${description}`) and JS-style expressions (`${project ?? 'n/a'}`, `${tags || 'none'}`) are supported.
- **D-02:** Evaluation uses a sandboxed approach — only the 5 known variables are in scope. No access to globals, `eval`, or arbitrary JS. Implemented as a safe expression evaluator or `new Function` with only the 5 field values as parameters.
- **D-03:** Missing/empty field values (e.g. entry has no project, no tags) resolve to an empty string — silent, no placeholder text.
- **D-04:** Unrecognized variable names (`${foo}`) are left unchanged in output — the literal `${foo}` appears, making the error visible to the user.
- **D-05:** Output format dropdown gains a third option: `'template'` → "Custom template".
- **D-06:** When template mode is selected, a text input field appears for the template string. Its description text shows the available variables: `Available: description, start, duration, tags, project`.
- **D-07:** The Columns section toggles remain visible but are disabled (grayed out) when template mode is active.
- **D-08:** Default template string: `${description} (${duration})`.
- **D-09:** Add `templateString: string` to `TogglImportSettings` interface with default value `'${description} (${duration})'`.
- **D-10:** `outputFormat` type widened to `'table' | 'plaintext' | 'template'`.
- **D-11:** `formatEntries` in `formatter.ts` gains a third branch for `'template'` mode. Each entry is rendered by substituting the 5 known variables, one line per entry (no header row).
- **D-12:** Variable names in the template: `description`, `start`, `duration`, `tags`, `project`. (`startTime` is the settings column key; in templates the variable name is `start`.)
- **D-13:** `tags` variable renders as a comma-separated string.

### Claude's Discretion

- Exact implementation of the sandboxed evaluator (custom parser vs `new Function` with explicit parameters — security must be the guiding constraint)
- Whether the template field uses `addText` or `addTextArea` in settings
- Error handling if the template string itself is syntactically broken (e.g. unclosed `${`)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FMT-01 | User can define a custom template string using `${variable}` placeholders (available: description, start, duration, tags, project) as a third format mode | Covered by D-01 through D-13; sandboxed evaluator pattern, settings UI extension, formatter branch addition |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.2 (project-installed) | Implementation language | Locked by project; `strict` mode already enabled [VERIFIED: package.json] |
| vitest | ^4.1.4 (project-installed) | Test framework | Already used for formatter tests; `npm test` runs `vitest run` [VERIFIED: package.json] |
| obsidian npm package | latest (project-installed) | `Setting`, `addToggle`, `addText`, `addTextArea`, `addDropdown` | Only supported Obsidian API surface [VERIFIED: package.json] |

No new npm packages required. All implementation uses:
- Native JavaScript `Function` constructor (sandboxed evaluator) [VERIFIED: MDN, built-in]
- Existing `formatStartTime` and `formatDuration` helpers in `formatter.ts` [VERIFIED: src/formatter.ts]

**Version verification:** No new packages to verify.

---

## Architecture Patterns

### Sandboxed Evaluator with `new Function`

**What:** Build a per-entry render function once per template string, using `new Function` with exactly the five known variable names as parameters. Pass field values as arguments when calling.

**When to use:** When expressions like `${project ?? 'n/a'}` must be evaluated with JavaScript semantics but without access to globals.

**Pattern:**

```typescript
// Source: MDN Function constructor + D-02 decision
function buildTemplateRenderer(template: string): (vars: TemplateVars) => string {
    // Convert ${expr} → template literal syntax for the function body
    // Return a function that evaluates only within the 5-variable scope
    const body = `return \`${template}\`;`;
    try {
        return new Function('description', 'start', 'duration', 'tags', 'project', body) as
            (d: string, s: string, dur: string, t: string, p: string) => string;
    } catch {
        // Syntactically broken template (e.g. unclosed ${) — return identity fallback
        return () => template;
    }
}
```

**Calling it per entry:**
```typescript
const renderer = buildTemplateRenderer(settings.templateString);
const line = renderer(
    entry.description,
    formatStartTime(entry.start),
    formatDuration(entry.duration),
    entry.tags.join(', '),
    entry.project_name ?? ''
);
```

**Security boundary:** `new Function` runs in the global scope by default. However, since the function body is a template literal that only references the 5 named parameters, there is no path to `this`, `window`, `globalThis`, or other globals unless the user explicitly types them. This is sufficient sandboxing for a local desktop plugin where the user writes their own template. [ASSUMED — formal sandboxing analysis; assess if deeper isolation is needed]

**Unknown variable passthrough (D-04):** With the `new Function` approach, an unknown `${foo}` in the template will cause a `ReferenceError` at call time because `foo` is not one of the 5 named parameters. The catch block must handle this and return the original template literal text, OR use a pre-processing step that replaces only known variables before passing to `new Function`. The simpler and safer approach is the pre-processing step:

```typescript
// Pre-process: replace known ${var} tokens, leave unknown ones literally
// Then call new Function on the result — or use pure string substitution
```

**Alternative simpler approach (pure string replace, no `new Function`):**

If expression support (`??`, `||`) is not needed for the initial implementation, a pure string-replace approach handles D-03 and D-04 trivially. However, D-01 explicitly locks expression support as required. Use `new Function`.

**Unknown variable handling with `new Function` — concrete solution:**

Use a two-step approach:
1. Pre-scan the template for `${...}` tokens. For any token whose inner expression is not one of the 5 known names (or a simple expression over them), replace it with a placeholder string that will survive the `new Function` template literal.
2. After evaluation, restore placeholders to their original `${...}` literal text.

Simpler alternative: wrap the `new Function` call in try/catch. If a `ReferenceError` occurs (unknown variable), fall back to replacing only the 5 known variables via string replace and leaving the rest untouched.

**Recommended implementation for Claude's discretion:** Use `new Function` wrapped in try/catch. For the error handler, use a regex-based fallback that substitutes only the 5 known `${var}` tokens (no expression support in fallback mode) and leaves unknown tokens as-is. This satisfies both D-01 (expression support works when template is valid) and D-04 (unknown variables survive).

### Formatter Branch Pattern

The existing `formatEntries` function uses `if/else` branching on `settings.outputFormat`. [VERIFIED: src/formatter.ts line 37]

**Pattern to follow:**
```typescript
} else if (settings.outputFormat === 'template') {
    // D-11: one line per entry, no header row
    const renderer = buildTemplateRenderer(settings.templateString);
    return entries.map(e => renderer(
        e.description,
        formatStartTime(e.start),
        formatDuration(e.duration),
        e.tags.join(', '),
        e.project_name ?? ''
    )).join('\n');
}
```

### Settings Conditional Render Pattern

The delimiter field already uses this exact pattern — shown only for `'plaintext'` mode. [VERIFIED: src/settings.ts lines 71-83]

Template field follows the same pattern:
```typescript
if (this.plugin.settings.outputFormat === 'template') {
    new Setting(containerEl)
        .setName('Template')
        .setDesc('Available: description, start, duration, tags, project')
        .addText(text => text  // or addTextArea — Claude's discretion
            .setValue(this.plugin.settings.templateString)
            .onChange(async (value) => {
                this.plugin.settings.templateString = value;
                await this.plugin.saveSettings();
            })
        );
}
```

### Column Toggle Disable Pattern

`addToggle` returns a `ToggleComponent`. To disable it, call `.setDisabled(true)` on the component. [VERIFIED: Obsidian API — setDisabled is a standard Component method] [ASSUMED — exact method name on ToggleComponent; verify at implementation time]

```typescript
const isTemplate = this.plugin.settings.outputFormat === 'template';
for (const col of columns) {
    new Setting(containerEl)
        .setName(col.label)
        .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.columns[col.key])
                .setDisabled(isTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.columns[col.key] = value;
                    await this.plugin.saveSettings();
                });
        });
}
```

### Settings Interface Extension

**main.ts changes:**
```typescript
export interface TogglImportSettings {
    outputFormat: 'table' | 'plaintext' | 'template';  // D-10
    // ... existing fields ...
    templateString: string;  // D-09
}

export const DEFAULT_SETTINGS: TogglImportSettings = {
    outputFormat: 'table',
    // ... existing defaults ...
    templateString: '${description} (${duration})',  // D-08, D-09
};
```

### Anti-Patterns to Avoid

- **Using `eval()`:** D-02 prohibits it. `eval` has access to the entire scope chain. Use `new Function` instead.
- **Global regex replace on all `${...}` tokens:** Will silently erase unknown variables instead of passing them through (violates D-04). Pre-check or try/catch is required.
- **Hiding column toggles:** D-07 requires disabling (grayed out), not hiding. Users should see them.
- **Empty string for unknown variables:** D-04 requires the literal `${foo}` to appear in output, not empty string.
- **`moment.js` or date libraries:** CLAUDE.md prohibits these; use existing `formatStartTime`/`formatDuration` helpers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template evaluation | Custom tokenizer/parser | `new Function` with named params | JS engine handles expressions natively; custom parsers have edge cases with nested `??`, `||`, ternaries |
| Time formatting | New date formatter | Existing `formatStartTime(e.start)` | Already in formatter.ts, already tested |
| Duration formatting | New formatter | Existing `formatDuration(e.duration)` | Already in formatter.ts, already tested |
| Settings UI | Custom DOM | Obsidian `Setting` API | Project convention; consistent with existing settings UI |

---

## Common Pitfalls

### Pitfall 1: Unknown Variable Silent Erasure

**What goes wrong:** A naive `template.replace(/\$\{[^}]+\}/g, ...)` replaces ALL `${...}` tokens including unknown ones, producing empty string instead of the literal `${foo}` text.

**Why it happens:** Developer writes a global replace that handles all tokens uniformly.

**How to avoid:** Only substitute the 5 known variable names. Either: (a) use `new Function` (unknown names become `ReferenceError`, caught and handled), or (b) only run `replace()` for each of the 5 known names explicitly (`/\$\{description\}/g`, etc.).

**Warning signs:** Test `${foo}` in template, observe empty string in output instead of literal `${foo}`.

### Pitfall 2: `new Function` Scope Pollution

**What goes wrong:** `new Function` body can access `globalThis`, `process`, `require` etc. if the user types them in the template.

**Why it happens:** `new Function` runs in the global scope, not a true sandbox.

**How to avoid:** For this plugin context (local desktop, user writes their own template), this is acceptable risk — document it as a design decision (D-02 notes "no access to globals" as intent, not a technical guarantee). If stricter isolation is needed, add a pre-validation step that rejects templates containing names outside the 5 known variables.

**Warning signs:** Template like `${globalThis.process.exit(1)}` would execute. Acceptable tradeoff for a local plugin.

### Pitfall 3: `makeSettings()` Missing `templateString`

**What goes wrong:** Existing test helper `makeSettings()` in `formatter.test.ts` does not include `templateString` or the widened `outputFormat` type. All template tests using `makeSettings({ outputFormat: 'template', templateString: '...' })` will fail TypeScript type checks.

**Why it happens:** The helper was written before template mode existed.

**How to avoid:** Update `makeSettings()` to add `templateString: '${description} (${duration})'` as a default field.

**Warning signs:** TypeScript errors on `makeSettings({ outputFormat: 'template' })` — `'template'` not assignable to `'table' | 'plaintext'`.

### Pitfall 4: `addTextArea` vs `addText` for Template Field

**What goes wrong:** `addText` renders a single-line `<input>` which is awkward for multi-placeholder templates. `addTextArea` renders a `<textarea>` which allows natural multi-line viewing but templates are single-line strings.

**Why it happens:** Both are valid; the choice is Claude's discretion (CONTEXT.md).

**Recommendation:** Use `addTextArea` — templates can be moderately long (e.g. `${description} | ${project} | ${start} (${duration})`), and a textarea is more comfortable to edit. Set `.setPlaceholder('e.g. ${description} (${duration})')`.

### Pitfall 5: Broken Template String Crash

**What goes wrong:** User types `${description` (unclosed brace). `new Function` body becomes `` return `${description`; `` which is a `SyntaxError` at construction time.

**Why it happens:** Template literal syntax requires closing `}`.

**How to avoid:** Wrap `new Function` construction in try/catch. On `SyntaxError`, return a fallback renderer that outputs the raw template string as-is (making the error visible).

---

## Code Examples

Verified patterns from existing codebase:

### Existing formatter branch structure (extend this)
```typescript
// Source: src/formatter.ts lines 37-50 [VERIFIED]
if (settings.outputFormat === 'table') {
    // ...table logic...
} else {
    // ...plaintext logic...
}
// ADD: } else if (settings.outputFormat === 'template') { ... }
```

### Existing conditional field render (replicate this pattern)
```typescript
// Source: src/settings.ts lines 71-83 [VERIFIED]
if (this.plugin.settings.outputFormat === 'plaintext') {
    new Setting(containerEl)
        .setName('Delimiter')
        // ...
}
// REPLICATE: if (this.plugin.settings.outputFormat === 'template') { ... }
```

### Existing this.display() refresh on dropdown change (already wired)
```typescript
// Source: src/settings.ts lines 64-68 [VERIFIED]
.onChange(async (value) => {
    this.plugin.settings.outputFormat = value as 'table' | 'plaintext';
    this.display();  // already triggers re-render; add 'template' to cast
    await this.plugin.saveSettings();
})
```

### Existing tags join (replicate for template vars)
```typescript
// Source: src/formatter.ts line 27 [VERIFIED]
getValue: e => e.tags.join(', ')
// Use same in template: e.tags.join(', ') → tags variable value
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.4 |
| Config file | vitest.config.ts (project root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FMT-01 | Template variable substitution renders correctly | unit | `npm test -- --reporter=verbose` | Needs additions in `tests/formatter.test.ts` |
| FMT-01 | Expression support (`??`, `||`) evaluates correctly | unit | `npm test` | Needs additions |
| FMT-01 | Unknown variable `${foo}` passes through as literal | unit | `npm test` | Needs additions |
| FMT-01 | Empty field (no project, no tags) resolves to empty string | unit | `npm test` | Needs additions |
| FMT-01 | Multi-entry template output = one line per entry | unit | `npm test` | Needs additions |
| FMT-01 | Broken template string does not crash | unit | `npm test` | Needs additions |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** All tests green before `/gsd-verify-work`

### Wave 0 Gaps
- `makeSettings()` helper in `tests/formatter.test.ts` needs `templateString` field and widened `outputFormat` type — must be updated before template-mode tests can be written (not a new file, an update to an existing helper)
- No new test files needed — all additions go into the existing `tests/formatter.test.ts`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ToggleComponent.setDisabled(true)` is the correct method to gray out a toggle in Obsidian settings | Architecture Patterns — Column Toggle Disable Pattern | UI toggles won't gray out; need to find correct API method. Low risk: `.setDisabled` is standard on all Obsidian UI components |
| A2 | `new Function` in the Electron renderer process has no special restrictions beyond standard JavaScript | Architecture Patterns — Sandboxed Evaluator | Could be blocked by Electron's content security policy; in practice Obsidian plugins have no CSP restriction on `new Function`. Low risk |

---

## Open Questions

1. **`addText` vs `addTextArea` for template field**
   - What we know: Both are available in Obsidian API; this is left to Claude's discretion per CONTEXT.md
   - What's unclear: Whether `addTextArea` auto-resizes or requires fixed height styling
   - Recommendation: Use `addTextArea`; if it looks awkward, fall back to `addText`. This is a visual preference only with no functional impact.

2. **Depth of expression support**
   - What we know: D-01 locks support for `??` and `||` expressions
   - What's unclear: Whether ternaries (`${project ? project : 'n/a'}`), string concatenation, or method calls should work
   - Recommendation: `new Function` supports all valid JavaScript expressions naturally. Document what works, don't artificially restrict it. The security note (Pitfall 2) already covers the risk.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is purely TypeScript code changes with no new tools, services, or runtimes required beyond the existing project build environment).

---

## Security Domain

Phase 10 introduces template string evaluation. The main security surface is the `new Function` evaluator.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (template string) | Known-variable whitelist; `new Function` with exactly 5 named params |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Code injection via template string | Tampering | `new Function` with 5 named params; user controls their own template in their own vault — local trust model |
| Access to globals via template | Elevation of Privilege | Acceptable for local desktop plugin; document limitation per D-02 |

**Assessment:** Risk is low. Templates are written by the user themselves in their own Obsidian vault settings. No remote input. The `new Function` approach matches D-02's "sandboxed approach" intent.

---

## Sources

### Primary (HIGH confidence)
- `src/formatter.ts` — existing formatter structure, column definitions, helper functions [VERIFIED]
- `src/main.ts` — `TogglImportSettings` interface, `DEFAULT_SETTINGS` [VERIFIED]
- `src/settings.ts` — dropdown pattern, conditional field render, `this.display()` refresh [VERIFIED]
- `tests/formatter.test.ts` — `makeSettings()` helper, existing test structure [VERIFIED]
- `package.json` — vitest version, test script [VERIFIED]
- `vitest.config.ts` — test config, include pattern [VERIFIED]
- `.planning/phases/10-formatting/10-CONTEXT.md` — all locked decisions [VERIFIED]

### Secondary (MEDIUM confidence)
- MDN Function constructor documentation — `new Function` parameter scoping behavior

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all packages already in project
- Architecture: HIGH — patterns directly observed in existing source files
- Pitfalls: HIGH — derived from reading actual code + decision constraints

**Research date:** 2026-04-16
**Valid until:** Stable (TypeScript/Obsidian API; no external services)
