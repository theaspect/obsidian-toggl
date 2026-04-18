---
status: investigating
trigger: several dozen tests are failed https://github.com/theaspect/obsidian-toggl-import/actions/runs/24601087591
created: 2026-04-18
updated: 2026-04-18
---

# Debug Session: ci-test-failures

## Symptoms

- **Expected:** All tests pass in CI
- **Actual:** 10 test failures across 2 files (settings.test.ts × 5, command.test.ts × 5)
- **Error messages:**
  - `setDisabled is not a function` at src/settings.ts:107 (settings tests)
  - Capitalization/text mismatches in notice strings (command tests)
- **Timeline:** Observed in GH Actions run 24601087591 on 2026-04-18
- **Reproduction:** Run `npm test` or push to CI

## Evidence

- timestamp: 2026-04-18T00:00:00Z
  finding: >
    FakeSetting mock in tests/settings.test.ts is missing setDisabled() method.
    settings.ts calls .setDisabled() on Setting instances at lines 107, 123, 150.
    FakeSetting only has setName, setDesc, setHeading, addText, addDropdown, addToggle, addTextArea, addButton.

- timestamp: 2026-04-18T00:00:00Z
  finding: >
    Capitalization mismatches between src/main.ts and tests/command.test.ts:
    1. Command name: source has 'Import Toggl entries', test expects 'Import Toggl Entries'
    2. Settings notice: source has 'settings → Toggl import', test expects 'Settings → Toggl Import'
    3. Date error notice: source has '...2026-01-15 daily note)', test expects '...2026-01-15 Daily Note)'

## Current Focus

hypothesis: Two independent root causes — missing mock method and capitalization drift in source strings
test: Run npm test after applying fixes
expecting: All 10 previously-failing tests pass
next_action: Apply fixes to FakeSetting mock and main.ts notice strings

## Eliminated

## Resolution

root_cause: >
  1. FakeSetting mock missing setDisabled() → tests/settings.test.ts needs setDisabled(_: boolean) { return this; }
  2. main.ts notice strings use lowercase where tests expect Title Case
fix: pending
verification: pending
files_changed:
