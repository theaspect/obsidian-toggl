# Phase 10: Formatting - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 10-formatting
**Areas discussed:** Empty/missing field behavior, Column toggles with template mode, Default template string, Unknown placeholder handling

---

## Empty/Missing Field Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Empty string (silent) | Renders nothing for missing values | |
| A literal dash — | Renders a visible placeholder | |
| User-specified via expression | Support `${project ?? 'n/a'}` style expressions | ✓ |

**User's choice:** Empty string for missing values by default; expressions like `${project ?? 'n/a'}` supported so users can specify their own fallback. Implementation must be sandboxed (no arbitrary JS access — only the 5 known variables in scope).

---

## Column Toggles with Template Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Hide Columns section in template mode | Clean, no confusion | |
| Keep Columns visible but ignored | Simpler, potentially confusing | |
| Visible but disabled | Grayed out; user can see they exist but can't interact | ✓ |

**User's choice:** Column toggles remain visible but disabled (grayed out) in template mode. User should also get a clear hint about available variables from the template field's description text.

---

## Default Template String

| Option | Description | Selected |
|--------|-------------|----------|
| `${description} (${duration})` | Short, shows two common fields, demonstrates syntax | ✓ |
| `${description} \| ${start} \| ${duration}` | More fields, separator pattern | |
| Empty string | Forces user to write their own | |

**User's choice:** `${description} (${duration})`

---

## Unknown Placeholder Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Render as empty string | Silent, consistent with missing values | |
| Leave placeholder unchanged | `${foo}` appears in output — error visible to user | ✓ |
| Claude's discretion | | |

**User's choice:** Leave unchanged — `${foo}` appears literally in output, making the unrecognized variable obvious.

---

## Claude's Discretion

- Exact sandboxed evaluator implementation approach
- Whether template field uses `addText` vs `addTextArea`
- Error handling for syntactically broken templates

## Deferred Ideas

None.
