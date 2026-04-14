---
phase: 07-ci-fixes
plan: "02"
subsystem: ci
tags: [github-actions, ci, nodejs, workflow]
dependency_graph:
  requires: []
  provides: [CI-01]
  affects: [.github/workflows/ci.yml, .github/workflows/release.yml]
tech_stack:
  added: []
  patterns: [github-actions-workflow, npm-caching]
key_files:
  created:
    - .github/workflows/ci.yml
  modified:
    - .github/workflows/release.yml
decisions:
  - "ci.yml uses three separate run steps (install, build, test) rather than a combined script for clear failure attribution in CI logs"
  - "npm cache enabled in ci.yml only; release.yml runs rarely so cache omitted per plan"
  - "No permissions block in ci.yml — GitHub defaults are read-only for PR workflows, satisfying T-07-05"
metrics:
  duration: "5 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  files_changed: 2
---

# Phase 07 Plan 02: CI Workflow + Node.js 24 Bump Summary

New `ci.yml` GitHub Actions workflow running build + test on every push/PR to main, and `release.yml` Node.js version bumped from 22 to 24 — satisfying CI-01 with minimal surface.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create .github/workflows/ci.yml | e22ed3e | .github/workflows/ci.yml (new) |
| 2 | Bump release.yml Node version from 22 to 24 | 83cd5f9 | .github/workflows/release.yml |

## What Was Built

**ci.yml** — A new GitHub Actions workflow that:
- Triggers on `push` to `main` and `pull_request` targeting `main`
- Uses `actions/checkout@v4` and `actions/setup-node@v4` with `node-version: "24"` and `cache: "npm"`
- Runs three separate steps: `npm install`, `npm run build`, `npm test`
- No `permissions:` block (read-only default for PR workflows per T-07-05)

**release.yml** — Single-line change: `node-version: "22"` to `node-version: "24"`. All other content preserved byte-identical: tag trigger, env block, permissions, checkout, build, and release steps unchanged.

## Decisions Made

- Three separate `run:` steps in ci.yml rather than a combined `|` block so CI log attributes failures to the correct step clearly.
- npm caching added to ci.yml only; release runs once per tag push so caching adds negligible benefit there.
- No `workflow_dispatch:` trigger added — out of scope for this phase.
- No matrix builds, no lint steps, no artifact uploads — minimal surface as specified.

## Verification Results

- Both workflow files use `node-version: "24"` with no `"22"` present anywhere
- `git diff .github/workflows/release.yml` shows exactly one changed line (the node-version value)
- ci.yml contains 3 separate `run:` steps confirming non-combined structure
- ci.yml has no `strategy:`, `matrix:`, `permissions:`, or `workflow_dispatch:` blocks

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — ci.yml introduces no new network endpoints, auth paths, or secret reads. The omission of a `permissions:` block in ci.yml is intentional and mitigates T-07-05 (elevation of privilege). All action pins use major version tags (@v4, @v2) per T-07-06.

## Self-Check: PASSED

- .github/workflows/ci.yml — FOUND
- .github/workflows/release.yml — FOUND (node-version: "24" confirmed)
- Commit e22ed3e — FOUND (feat(07-02): add CI workflow)
- Commit 83cd5f9 — FOUND (chore(07-02): bump release.yml Node version)
