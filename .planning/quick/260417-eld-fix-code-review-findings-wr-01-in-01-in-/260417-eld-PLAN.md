---
phase: quick-260417-eld
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - versions.json
autonomous: true
requirements: [WR-01, IN-01, IN-02]
must_haves:
  truths:
    - "package.json pins obsidian to 1.8.7 instead of latest"
    - "package.json declares repository field with correct git URL"
    - "versions.json maps 1.0.0 to minAppVersion 1.4.0 instead of 1.0.0"
  artifacts:
    - path: "package.json"
      provides: "Pinned obsidian version + repository metadata"
    - path: "versions.json"
      provides: "Correct minAppVersion mapping for 1.0.0 release"
  key_links:
    - from: "package.json devDependencies.obsidian"
      to: "1.8.7"
      via: "exact version pin"
    - from: "versions.json[\"1.0.0\"]"
      to: "1.4.0"
      via: "minAppVersion value"
---

<objective>
Apply three code review fixes to package.json and versions.json: pin the obsidian devDependency to an exact version (WR-01), add the repository field for registry submission (IN-01), and correct the minAppVersion for the 1.0.0 plugin release entry (IN-02).

Purpose: These are blocking registry submission requirements identified in the code review.
Output: Updated package.json and versions.json with all three findings resolved.
</objective>

<execution_context>
@C:/Work/obsidian-toggl/.claude/get-shit-done/workflows/execute-plan.md
@C:/Work/obsidian-toggl/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Apply WR-01, IN-01, IN-02 fixes to package.json and versions.json</name>
  <files>package.json, versions.json</files>
  <action>
Make the following three targeted changes:

**package.json — WR-01:** In `devDependencies`, change:
  `"obsidian": "latest"`
to:
  `"obsidian": "1.8.7"`

**package.json — IN-01:** Add a `"repository"` field at the top level (after `"license"`):
  `"repository": {"type": "git", "url": "https://github.com/theaspect/obsidian-toggl-import.git"}`

**versions.json — IN-02:** Change:
  `"1.0.0": "1.0.0"`
to:
  `"1.0.0": "1.4.0"`

The entry `"1.1.0": "1.8.7"` in versions.json must remain unchanged.

Do NOT run `npm install` — the version pin is a metadata-only change to avoid floating resolution. The lock file update is not required as part of this fix.
  </action>
  <verify>
    <automated>node -e "const p=require('./package.json');const v=require('./versions.json');if(p.devDependencies.obsidian!=='1.8.7')throw new Error('WR-01 not fixed');if(!p.repository||p.repository.url!=='https://github.com/theaspect/obsidian-toggl-import.git')throw new Error('IN-01 not fixed');if(v['1.0.0']!=='1.4.0')throw new Error('IN-02 not fixed');console.log('All three findings resolved.')"</automated>
  </verify>
  <done>
    - package.json devDependencies.obsidian is "1.8.7" (not "latest")
    - package.json has repository.url = "https://github.com/theaspect/obsidian-toggl-import.git"
    - versions.json["1.0.0"] is "1.4.0"
    - versions.json["1.1.0"] is still "1.8.7"
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| package.json metadata | No runtime trust boundary — these are build-time metadata fields only |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-eld-01 | Tampering | package.json repository URL | accept | URL is public registry metadata; no secret data involved |
</threat_model>

<verification>
Run the inline node one-liner from the verify block to confirm all three values are set correctly. No build or install step required.
</verification>

<success_criteria>
- `node -e` verification script exits 0 and prints "All three findings resolved."
- No other fields in package.json or versions.json are changed
</success_criteria>

<output>
After completion, create `.planning/quick/260417-eld-fix-code-review-findings-wr-01-in-01-in-/260417-eld-SUMMARY.md` summarising what was changed and the commit hash.
</output>
