# Phase 10: Formatting - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a custom template string as a third format mode (`outputFormat: 'template'`). Users write a string like `${description} (${duration})` in settings and each imported entry is rendered by substituting placeholders. The five available variables are: `description`, `start`, `duration`, `tags`, `project`. Table and plain text modes are unchanged.

</domain>

<decisions>
## Implementation Decisions

### Template Syntax and Evaluation
- **D-01:** Template placeholders use `${variable}` syntax. Simple variable references (`${description}`) and JS-style expressions (`${project ?? 'n/a'}`, `${tags || 'none'}`) are supported.
- **D-02:** Evaluation uses a sandboxed approach — only the 5 known variables are in scope. No access to globals, `eval`, or arbitrary JS. Implemented as a safe expression evaluator or `new Function` with only the 5 field values as parameters.
- **D-03:** Missing/empty field values (e.g. entry has no project, no tags) resolve to an empty string — silent, no placeholder text.
- **D-04:** Unrecognized variable names (`${foo}`) are left unchanged in output — the literal `${foo}` appears, making the error visible to the user.

### Settings UI
- **D-05:** Output format dropdown gains a third option: `'template'` → "Custom template".
- **D-06:** When template mode is selected, a text input field appears for the template string. Its description text shows the available variables: `Available: description, start, duration, tags, project`.
- **D-07:** The Columns section toggles remain visible but are **disabled** (grayed out) when template mode is active. Column selection has no effect on template output — the template string controls which fields appear.
- **D-08:** Default template string (used when user first selects template mode and no template has been saved): `${description} (${duration})`.

### Settings Interface Persistence
- **D-09:** Add `templateString: string` to `TogglImportSettings` interface with default value `'${description} (${duration})'`.
- **D-10:** `outputFormat` type widened to `'table' | 'plaintext' | 'template'`.

### Formatter
- **D-11:** `formatEntries` in `formatter.ts` gains a third branch for `'template'` mode. Each entry is rendered by substituting the 5 known variables into the template string, one line per entry (no header row).
- **D-12:** Variable names in the template match the requirement spec exactly: `description`, `start`, `duration`, `tags`, `project`. (Note: `startTime` is the settings column key; in templates the variable name is `start`.)
- **D-13:** `tags` variable renders as a comma-separated string (same as existing `tags.join(', ')` behavior).

### Claude's Discretion
- Exact implementation of the sandboxed evaluator (custom parser vs `new Function` with explicit parameters — security must be the guiding constraint)
- Whether the template field uses `addText` or `addTextArea` in settings
- Error handling if the template string itself is syntactically broken (e.g. unclosed `${`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §FMT-01 — acceptance criteria for this phase

### Source files to modify
- `src/formatter.ts` — `formatEntries` function; add `'template'` branch; import/use template evaluator
- `src/main.ts` — `TogglImportSettings` interface (widen `outputFormat`, add `templateString`), `DEFAULT_SETTINGS` (add `templateString` default)
- `src/settings.ts` — output format dropdown (add `'template'` option), show template string field conditionally, disable column toggles in template mode

### Test files to update
- `tests/formatter.test.ts` — add template mode tests covering: variable substitution, expression support (`??`, `||`), unknown variable passthrough, empty field behavior, multi-entry output

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `formatStartTime(isoString)` in `formatter.ts` — already formats ISO → `HH:MM`; use this for the `start` variable value
- `formatDuration(secs)` in `formatter.ts` — already formats seconds → `1h 30m`; use this for the `duration` variable value
- `addDropdown` pattern in `settings.ts` for `outputFormat` — extend with third option
- `this.display()` refresh on `onChange` — already used; ensures template field shows/hides and column toggles enable/disable on format change
- Delimiter field conditional render (only shown for plaintext) — exact same pattern to apply for template string field

### Established Patterns
- TDD RED→GREEN: write failing tests first, then implement (project-wide Key Decision)
- Settings fields: `TogglImportSettings` interface → `DEFAULT_SETTINGS` → settings tab display
- Column toggles use `addToggle` in a loop over `columns` array — disable by calling `.setDisabled(true)` when template mode active

### Integration Points
- `src/formatter.ts` — add third `else if (settings.outputFormat === 'template')` branch after existing plaintext branch
- `src/settings.ts` — after output format dropdown onChange, `this.display()` already called; column toggle loop needs `setDisabled(isTemplate)` added
- `tests/formatter.test.ts` — `makeSettings()` helper needs `templateString` field added to the base settings factory

</code_context>

<specifics>
## Specific Ideas

- Expression support example: `${project ?? 'n/a'}` renders `'n/a'` when entry has no project assigned
- Template field description text: `Available: description, start, duration, tags, project`
- Unknown variable example: `${foo}` in template → literal `${foo}` in output (not an empty string)
- Column toggles grayed out (not hidden) so users can see them and understand they exist — they're just inactive in template mode

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-formatting*
*Context gathered: 2026-04-16*
