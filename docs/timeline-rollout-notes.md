# Universal timeline rollout notes

## Phase A shipped scope

- Foundational seed lessons are persisted as schema version 2 instructional timelines.
- Legacy foundational guided-step records can still be adapted at runtime for backward compatibility.
- Normal learner routes render `TimelinePlayer` for playable lessons.
- Unverified song and melody lessons are `migration-blocked` and unavailable for playback.
- `complete-ode-to-joy` is the only approved verified song timeline.

## Production rollout guardrails

- Do not present instructional timing as original song rhythm.
- Do not unblock song phrases or complete songs without approved provenance.
- Keep `legacySteps` only as migration/audit input.
- Run the song audit before and after each content migration batch.
- Back up the target database before any persisted migration command is introduced.

## Deferred phases

- Tone.js transport replacement as the single musical clock.
- Metronome and reference playback scheduling.
- Loop controls and loop-pass scoring.
- Full seek-state reset across judgement, audio, and recovery.
- Progress schema version upgrade for tempo, preferences, attempts, and practice time.
- Controlled database migration commands with dry-run, backup guard, database-name verification, idempotent updates, and rollback notes.
- Playwright end-to-end coverage for guided recovery, chord input, verified songs, reload preference restoration, and mobile landscape.
- Broader `TimelinePlayer` component split.
