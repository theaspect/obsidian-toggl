---
phase: 5
slug: command
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | CMD-01 | — | N/A | unit | `npm test -- tests/command.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | CMD-02 | — | N/A | unit | `npm test -- tests/command.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | CMD-03 | — | N/A | unit | `npm test -- tests/command.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-04 | 01 | 1 | CMD-05 | — | N/A | unit | `npm test -- tests/command.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-05 | 01 | 1 | CMD-06 | — | N/A | unit | `npm test -- tests/command.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-06 | 01 | 1 | CMD-07 | — | N/A | unit | `npm test -- tests/command.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-07 | 01 | 1 | REIMP-01 | — | N/A | unit | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/command.test.ts` — stubs for CMD-01 through CMD-07, REIMP-01

*Existing vitest infrastructure is confirmed working (40 passing tests). Only the command test file needs to be created.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Command appears in Obsidian command palette | CMD-01 | Requires live Obsidian instance | Open Obsidian, press Ctrl+P, type "Import Toggl" — command should appear |
| Entries inserted at cursor position | CMD-02 | Requires live Obsidian + Toggl token | Open yyyy-mm-dd note, place cursor, run command, verify insertion at cursor |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
