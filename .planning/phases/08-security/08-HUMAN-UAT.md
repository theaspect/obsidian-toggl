---
status: partial
phase: 08-security
source: [08-VERIFICATION.md]
started: 2026-04-15T09:30:00.000Z
updated: 2026-04-15T09:30:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Success path — valid token shows "Connected as [name]"
expected: Enter a valid Toggl API token in settings, click "Test connection". Button is disabled (greyed out) while request is in-flight. After response, a Notice appears: "Connected as [fullname]". Button re-enables.
result: [pending]

### 2. Failure path — invalid token shows error Notice
expected: Enter an invalid/wrong token, click "Test connection". Button is disabled during request. After response, a Notice appears with an error message (e.g. "Toggl API error: invalid API token (401)"). Button re-enables.
result: [pending]

### 3. Legacy migration — data.json apiToken is sanitized on load
expected: Manually add `"apiToken": "some-token"` to the plugin's data.json. Reload the plugin (or restart Obsidian). After load, the token field in settings is empty (token was in data.json, not localStorage). Verify data.json no longer contains `apiToken` key.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
