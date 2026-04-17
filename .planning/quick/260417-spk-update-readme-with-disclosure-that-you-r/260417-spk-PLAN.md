---
phase: quick
plan: 260417-spk
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "README discloses that a Toggl account and API token are required"
    - "README states the plugin communicates with the Toggl API over the network"
    - "README states the plugin is not affiliated with, endorsed by, or associated with Toggl OÜ"
  artifacts:
    - path: "README.md"
      provides: "Third-party service disclosure section"
      contains: "not affiliated"
---

<objective>
Add a disclosure section to README.md covering three required disclosures for Obsidian Community Plugin registry submission:
1. A Toggl Track account and API token are required to use the plugin.
2. The plugin communicates with the Toggl API (external network calls).
3. The plugin is not affiliated with, endorsed by, or associated with Toggl OÜ.

Purpose: Obsidian's community plugin reviewer guidelines require third-party service disclosures. Without these, registry submission will be rejected.
Output: Updated README.md with a "Third-Party Service Disclosure" section.
</objective>

<execution_context>
@C:/Work/obsidian-toggl/.claude/get-shit-done/workflows/execute-plan.md
@C:/Work/obsidian-toggl/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add third-party service disclosure section to README</name>
  <files>README.md</files>
  <action>
Insert a new "## Third-Party Service" section into README.md. Place it between the "## Settings" section and the "## Development" section so it appears before developer-facing content but after all user-facing content.

The section must contain three disclosures:

1. **Account requirement** — Using this plugin requires a Toggl Track account and API token. Sign up at track.toggl.com.
2. **Network communication** — The plugin communicates with the Toggl Track API (`https://api.track.toggl.com`) to fetch your time entries. No data is sent to any other server. Refer to Toggl's privacy policy at toggl.com/legal/privacy for details on how Toggl handles your data.
3. **No affiliation** — This plugin is an independent open-source project and is not affiliated with, endorsed by, or associated with Toggl OÜ or the Toggl Track product.

Use concise, plain language. Do not use bold for entire sentences — use it only for the lead phrase of each bullet. No external links beyond what is listed above.
  </action>
  <verify>grep -n "not affiliated" README.md && grep -n "api.track.toggl.com" README.md && grep -n "Toggl Track account" README.md</verify>
  <done>README.md contains all three disclosures: account requirement, network communication with API URL, and non-affiliation statement. Section appears between Settings and Development.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| n/a | Documentation-only change, no code paths modified |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| n/a | — | — | accept | No executable code changed; documentation update only |
</threat_model>

<verification>
grep -n "Third-Party Service" README.md
grep -n "not affiliated" README.md
grep -n "api.track.toggl.com" README.md
</verification>

<success_criteria>
README.md has a "Third-Party Service" section containing: (1) Toggl account requirement, (2) network communication disclosure with the API base URL, (3) non-affiliation statement. All three items are present and the section is positioned between Settings and Development.
</success_criteria>

<output>
After completion, create `.planning/quick/260417-spk-update-readme-with-disclosure-that-you-r/260417-spk-SUMMARY.md` with what was done, files modified, and commit hash.
</output>
