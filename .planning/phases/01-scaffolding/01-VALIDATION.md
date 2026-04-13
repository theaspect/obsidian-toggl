---
phase: 1
slug: scaffolding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (scaffolding phase — no tests yet) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && tsc --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | REL-01 | — | N/A | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | REL-01 | — | N/A | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | REL-02 | — | N/A | build | `tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 2 | REL-01 | — | N/A | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 2 | REL-02 | — | N/A | build | `tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — install obsidian, esbuild, typescript, @types/node
- [ ] `tsconfig.json` — correct compiler options for Obsidian plugin
- [ ] `esbuild.config.mjs` — bundler config producing main.js

*Existing infrastructure covers all phase requirements once scaffold files are created.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin loads in Obsidian without errors | REL-01 | Requires running Obsidian desktop app | Copy built files to `.obsidian/plugins/obsidian-toggl-import/`, enable plugin in Settings → Community Plugins, verify no error in Developer Tools console |
| manifest.json accepted by Obsidian | REL-01 | Requires Obsidian runtime | Enable plugin and confirm it appears in plugin list with correct name/version |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
