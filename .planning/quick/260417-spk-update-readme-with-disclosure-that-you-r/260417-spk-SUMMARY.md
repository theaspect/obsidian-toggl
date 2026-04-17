---
phase: quick
plan: 260417-spk
subsystem: docs
tags: [readme, disclosure, registry]
key-files:
  modified:
    - README.md
decisions: []
metrics:
  duration: "< 5 min"
  completed: "2026-04-17"
  tasks_completed: 1
  files_modified: 1
---

# Quick Task 260417-spk: Add Third-Party Service Disclosure to README

**One-liner:** Added "Third-Party Service" section to README disclosing Toggl account requirement, network communication URL, and non-affiliation statement for Obsidian Community Plugin registry submission.

## What Was Done

Added a new `## Third-Party Service` section to `README.md`, positioned between the `## Settings` and `## Development` sections.

The section contains three required disclosures:

1. **Account requirement** — discloses that a Toggl Track account and API token are required, with a link to sign up.
2. **Network communication** — discloses that the plugin communicates with `https://api.track.toggl.com`, that no other servers receive data, and links to Toggl's privacy policy.
3. **No affiliation** — states the plugin is an independent open-source project not affiliated with, endorsed by, or associated with Toggl OÜ or the Toggl Track product.

## Files Modified

| File | Change |
|------|--------|
| `README.md` | Added 6 lines: `## Third-Party Service` section with 3 disclosure bullet points |

## Commit

| Hash | Message |
|------|---------|
| b3bfd1d | docs(260417-spk): add third-party service disclosure section to README |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- README.md contains "not affiliated" (line 73)
- README.md contains "api.track.toggl.com" (line 72)
- README.md section order: Settings (55) → Third-Party Service (69) → Development (75)
- Commit b3bfd1d exists in git log
