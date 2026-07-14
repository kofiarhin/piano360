# Song timing audit

Generated from the current Phase A seed catalogue with:

```bash
npm run audit:songs -w @piano360/api
```

## Summary

| Status              | Count | Meaning                                                                                        |
| ------------------- | ----: | ---------------------------------------------------------------------------------------------- |
| Ready               |     1 | Approved verified timeline exists.                                                             |
| Needs transcription |   126 | Only ordered prompts or retained legacy note lists exist. Rhythm must be sourced and reviewed. |
| Needs review        |     0 | Timeline exists but lacks approved provenance.                                                 |
| Blocked             |     0 | Reserved for malformed or otherwise blocked audit records.                                     |

Audited song/melody lesson count: 127.

Foundational drills are excluded from this audit. `finger-placement` and `beginner-chords` are persisted as instructional timelines and are not song-timing candidates.

## Ready lesson

| Course       | Lesson                | Source                           | Notes                                                                                   |
| ------------ | --------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| `ode-to-joy` | `complete-ode-to-joy` | `manual-transcription`, approved | Current reviewed reference timeline with BPM, 4/4 meter, beat positions, and durations. |

## Blocked lesson groups

The following lesson groups are migration-blocked because they lack approved source timing:

- `ode-to-joy`: `ode-first-phrase`, `ode-answer-phrase`
- `three-little-birds-limited-excerpt`: all phrase and complete lessons
- `one-love-limited-excerpt`: all phrase and complete lessons
- `redemption-song-limited-excerpt`: all phrase and complete lessons
- `rivers-of-babylon-limited-excerpt`: all phrase and complete lessons
- every other reggae melody course in the seed catalogue
- every gospel melody course in the seed catalogue

Reason for all blocked records:

```text
Verified beat positions, note durations, BPM, time signature, and approved source provenance are required before timeline playback.
```

Accepted timing sources:

- approved MIDI
- approved sheet music
- reviewed manual transcription
- reviewed recorded-performance timing

No blocked lesson may be unblocked by assigning equal beats to ordered notes.

## Rollout notes

Phase A keeps blocked lessons visible in course views for catalogue continuity. Learners see `Timing source required` / `Coming soon`; direct lesson URLs show a recoverable blocked message.

Next migration phase:

1. Choose one blocked song lesson.
2. Add verified timing and provenance.
3. Change it from `migration-blocked` to canonical `timeline`.
4. Run API validation, client tests, and the audit.
5. Document the source in this file.
