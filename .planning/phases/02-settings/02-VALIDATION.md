---
phase: 2
slug: settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test infrastructure exists |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Full build must be green + manual smoke test of settings UI

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | SET-01 | — | Token masked via `input type="password"` | manual + build | `npm run build` | ✅ existing | ⬜ pending |
| 2-01-02 | 01 | 1 | SET-02 | — | Warning text hardcoded (not user-controlled) | manual + build | `npm run build` | ✅ existing | ⬜ pending |
| 2-01-03 | 01 | 1 | SET-03 | — | N/A | manual + build | `npm run build` | ✅ existing | ⬜ pending |
| 2-01-04 | 01 | 1 | SET-04 | — | N/A | manual + build | `npm run build` | ✅ existing | ⬜ pending |
| 2-01-05 | 01 | 1 | SET-05 | — | N/A | manual + build | `npm run build` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/settings.ts` — new file for TogglImportSettingTab (all SET-0x requirements)

*No pre-existing test files needed — Wave 1 creates `src/settings.ts` directly.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Token input appears and is masked | SET-01 | Obsidian DOM/UI — no headless test env | Open plugin settings, verify token field with `type="password"` masking |
| Warning text visible under token field | SET-02 | Obsidian DOM/UI | Verify warning text is displayed as field description |
| Format dropdown switches between table/plaintext | SET-03 | Obsidian DOM/UI | Switch dropdown, verify `outputFormat` setting persists on Obsidian restart |
| Column toggles persist any combination | SET-04 | Obsidian DOM/UI | Toggle columns on/off, restart Obsidian, verify state preserved |
| Delimiter field appears only for plaintext format | SET-05 | Obsidian DOM/UI | Switch to table → delimiter hidden; switch to plaintext → delimiter visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
