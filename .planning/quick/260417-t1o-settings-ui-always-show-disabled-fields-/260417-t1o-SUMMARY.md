---
phase: quick
plan: 260417-t1o
subsystem: settings-ui
tags: [settings, ux, readme, docs]
dependency_graph:
  requires: []
  provides: [always-visible-settings-fields, release-docs]
  affects: [src/settings.ts, README.md]
tech_stack:
  added: []
  patterns: [disabled-field-pattern]
key_files:
  modified:
    - src/settings.ts
    - README.md
key_decisions:
  - Always-visible disabled fields preferred over conditional rendering for better discoverability
  - Output format dropdown reordered to Plain text first (matches dependent-field order: delimiter, then template)
  - Settings section order: API token, Test connection, Sort order, Day wrap time, Output format, Delimiter, Template, Columns
metrics:
  duration: ~5 minutes
  completed_date: "2026-04-17T13:57:07Z"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260417-t1o: Settings UI Always-Show Disabled Fields — Summary

**One-liner:** Settings delimiter/template fields always rendered with disabled state instead of conditional hiding; output format and section order improved; README gets release instructions.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Reorder settings and always-show delimiter/template fields | eae322f | src/settings.ts |
| 2 | Add Releasing a new version section to README | 00e6aee | README.md |

## What Was Done

### Task 1 — settings.ts

- Moved Sort order and Day wrap time sections before Output format (better logical flow: configure output last)
- Reordered Output format dropdown options: Plain text, Custom template, Markdown table
- Replaced `if (outputFormat === 'plaintext')` guard around Delimiter with always-visible field using `.setDisabled(outputFormat !== 'plaintext')`
- Replaced `if (outputFormat === 'template')` guard around Template with always-visible field using `.setDisabled(outputFormat !== 'template')`
- Preserved `this.display()` call in outputFormat onChange — still needed to refresh disabled states when user switches formats
- Preserved existing `isTemplate` const and column toggle disabled logic

### Task 2 — README.md

- Inserted "Releasing a new version" section between Development and License
- Documents three-file version bump (manifest.json, package.json, versions.json)
- Includes `git tag` + `git push origin <tag>` command that triggers GitHub Actions release workflow

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check: PASSED

- src/settings.ts: modified (eae322f)
- README.md: modified (00e6aee)
- Build: passes with no TypeScript errors
- Delimiter and Template fields always rendered in display()
- Sort order and Day wrap time appear before Output format in method body
- Output format dropdown order: Plain text, Custom template, Markdown table
- README contains "Releasing a new version" section between Development and License
