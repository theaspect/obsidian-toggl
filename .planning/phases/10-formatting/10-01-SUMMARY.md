---
phase: 10-formatting
plan: 01
subsystem: ui
tags: [typescript, obsidian-plugin, formatter, template, new-function, vitest]

requires:
  - phase: 09-import-behavior
    provides: TogglImportSettings interface with outputFormat, columns, delimiter, sortOrder fields

provides:
  - Custom template string as third format mode (outputFormat 'template')
  - renderTemplate() sandboxed evaluator using new Function with 5 named parameters
  - templateString field in TogglImportSettings with default '${description} (${duration})'
  - Template textarea in settings UI with conditional display
  - Column toggles disabled (grayed out) in template mode

affects: [settings, formatter, tests]

tech-stack:
  added: []
  patterns:
    - "Sandboxed new Function evaluator: template string evaluated with 5 named params, unknown variables pass through as literal ${foo}"
    - "Null-for-empty optional fields: pass null for empty project/tags so ?? operator works correctly; bare ${var} preprocessed to ${var ?? ''}"
    - "Conditional Settings UI: same pattern as delimiter field — conditional render on outputFormat check"

key-files:
  created: []
  modified:
    - src/main.ts
    - src/formatter.ts
    - src/settings.ts
    - tests/formatter.test.ts
    - tests/settings.test.ts

key-decisions:
  - "Pass null (not '') for empty optional fields (project, tags) so ${project ?? 'n/a'} works correctly in template expressions"
  - "Preprocess bare ${var} references to ${var ?? ''} so null renders as empty string for simple variable substitution"
  - "Use addTextArea (not addText) for template string field — better UX for moderately long templates"
  - "Fix FakeSetting mock in settings.test.ts to add setDisabled and addTextArea — Rule 1 auto-fix for test mock incompleteness"

patterns-established:
  - "Two-phase template evaluation: (1) replace unknown ${} tokens with placeholders, (2) evaluate with new Function, (3) restore placeholders"
  - "Null-for-empty optional field pattern in template vars for ?? expression support"

requirements-completed:
  - FMT-01

duration: 4min
completed: 2026-04-16
---

# Phase 10: Formatting — Plan 01 Summary

**Custom template string format mode with sandboxed `new Function` evaluator, settings textarea, and disabled column toggles — FMT-01 fully delivered**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-16T09:23:38Z
- **Completed:** 2026-04-16T09:27:36Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Template mode added as third `outputFormat` option (`'table' | 'plaintext' | 'template'`) with full expression support (`??`, `||`)
- 11 new template-mode tests covering variable substitution, expressions, unknown variable passthrough, empty fields, multi-entry output, and broken template safety
- Settings UI updated: dropdown shows "Custom template", textarea appears conditionally, column toggles disabled in template mode

## Task Commits

1. **Task 1: Implement template evaluator, formatter branch, and settings interface** - `dffeb27` (feat)
2. **Task 2: Update settings UI for template mode** - `fa89c64` (feat)

## Files Created/Modified

- `src/main.ts` - Widened outputFormat type to include 'template'; added templateString field and default
- `src/formatter.ts` - Added renderTemplate() sandboxed evaluator and 'template' branch in formatEntries()
- `src/settings.ts` - Added 'Custom template' dropdown option, conditional textarea, disabled column toggles
- `tests/formatter.test.ts` - Fixed makeSettings() helper (removed stale apiToken, added templateString/sortOrder); added 11 template-mode tests
- `tests/settings.test.ts` - Fixed FakeSetting mock: added setDisabled to toggle, added addTextArea method

## Decisions Made

- **Null for empty optional fields:** Pass `null` (not `''`) for empty `project_name` and empty `tags` array so `${project ?? 'n/a'}` evaluates correctly. Bare `${var}` references are preprocessed to `${var ?? ''}` so null renders as empty string for simple substitution. This satisfies both D-03 (empty fields → `''`) and D-01 (expression support works).
- **addTextArea over addText:** Template strings can be moderately long; textarea gives more comfortable editing experience. Per CONTEXT.md (Claude's discretion).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FakeSetting mock missing setDisabled and addTextArea**
- **Found during:** Task 2 (Update settings UI for template mode)
- **Issue:** FakeSetting.addToggle in tests/settings.test.ts returned an object without `setDisabled`, causing `TypeError: toggle.setValue(...).setDisabled is not a function` for all 7 settings tests
- **Fix:** Added `setDisabled: vi.fn().mockReturnThis()` to the toggle mock; added `addTextArea` method with placeholder/setValue/onChange stubs
- **Files modified:** tests/settings.test.ts
- **Verification:** npm test — all 77 tests pass
- **Committed in:** fa89c64 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Required fix for the test mock to support the new setDisabled API call. No scope creep.

## Issues Encountered

- **Template `??` operator semantics vs empty string:** `${project ?? 'n/a'}` with `project_name: ''` — JavaScript `??` only coalesces `null`/`undefined`, not `''`. The plan spec required this to return `'n/a'`. Resolved by passing `null` for empty optional fields and preprocessing bare `${var}` to `${var ?? ''}`. This satisfies both the empty-string test (D-03) and the expression test (D-01).

## Known Stubs

None — all template variables are fully wired to live entry data.

## Threat Flags

None — the `new Function` evaluator risk is documented in the plan's threat model (T-10-01 through T-10-03, all accepted per local desktop trust model).

## Next Phase Readiness

- FMT-01 complete: custom template mode fully implemented with tests
- Build clean (tsc + esbuild), all 77 tests passing
- Ready for UAT: user can select "Custom template" in settings, enter template string, import entries

---
*Phase: 10-formatting*
*Completed: 2026-04-16*

## Self-Check: PASSED

- src/main.ts: FOUND
- src/formatter.ts: FOUND
- src/settings.ts: FOUND
- tests/formatter.test.ts: FOUND
- .planning/phases/10-formatting/10-01-SUMMARY.md: FOUND
- Commit dffeb27: FOUND
- Commit fa89c64: FOUND
- All acceptance criteria: PASSED
- apiToken removed from makeSettings: CONFIRMED (0 occurrences)
