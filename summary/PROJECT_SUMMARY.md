# Project Summary

## Last Task

Removed falling-note visuals from normal timeline lessons and switched guidance to piano key highlights.

## Progress

- Removed `FallingNotesStage`, falling-note layout/types/geometry utilities, related styles, and stale browser alignment coverage.
- `TimelinePlayer` now renders `CoursePiano` directly and preserves target precedence, active/wrong priority, stop-and-wait, recovery, completion, persistence, and the four-beat guided lead-in.
- Added integration and browser coverage for no empty lane, single-note targets, chord targets, target advancement, completion clearing, wrong/active overrides, and responsive viewports.
- Validation passed: client typecheck/test/build, repo lint/typecheck/test/build, and browser target-guidance spec. Root `npm test` required `TEMP`/`TMP` on `D:\piano360-temp` because C: had too little free space for `mongodb-memory-server`.

## Files

- `apps/client/src/features/courses/timeline/TimelinePlayer.tsx`
- `apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx`
- `apps/client/src/styles.css`
- `apps/client/src/timeline-player-enhancements.css`
- `tests/browser/timeline-piano-guidance.spec.ts`
