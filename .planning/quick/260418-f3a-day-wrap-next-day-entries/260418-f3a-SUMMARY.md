---
quick_id: 260418-f3a
status: complete
date: 2026-04-18
---

# Summary: day wrap — include next-day entries before wrap time

## What was done

Extended `fetchTimeEntries` in `src/api.ts` to capture overnight entries when `dayWrapTime` is set:

1. **Extended API query range** — when `wrapMinutes > 0`, `end_date` is extended to `nextDay@wrapTime` instead of the current day's 23:59:59, so the API returns entries that started in the early hours of the next day.

2. **Updated filter logic** — the wrap filter now distinguishes between current-day and next-day entries:
   - Current day: keep entries at/after wrap time (unchanged — excludes entries that belong to the previous day)
   - Next day: keep entries *before* wrap time (new — includes overnight overflow entries)

3. **Added `addOneDay` and `localDateStr` helpers** — pure functions for date arithmetic and local date string formatting.

4. **3 new tests** in `tests/api.test.ts`:
   - `extends end_date past current day when wrap is set`
   - `includes next-day entries whose local start is before wrap time`
   - `excludes next-day entries whose local start is at or after wrap time`
   - Tests use local-time strings (no TZ suffix) to be timezone-independent.

## Result

82 tests pass, lint clean.
