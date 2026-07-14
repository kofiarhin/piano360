# Timeline authoring

Timeline lessons are the canonical learner-facing content model. A playable lesson must either contain a schema version 2 timeline or be resolved from a temporary legacy foundational drill adapter. Song and melody lessons must not be converted from note order alone.

## Canonical playable lesson

```ts
{
  mode: "timeline",
  contentKind: "foundational-drill" | "rhythm-drill" | "song-phrase" | "complete-song",
  defaultPracticeMode: "guided",
  availablePracticeModes: ["guided"],
  behaviour: {
    defaultPracticeMode: "guided",
    pauseOnMiss: true,
    enableTimingScore: false,
    timingProfile: "generous",
    allowPerformanceMode: false
  },
  timeline: {
    schemaVersion: 2,
    timingSource: "instructional" | "verified",
    originalBpm: 60,
    timeSignature: { numerator: 4, denominator: 4 },
    countInBeats: 4,
    totalBeats: 24,
    events: []
  }
}
```

Events are beat-based. `startBeat` controls horizontal position, `durationBeats` controls visual width and reference note length, and chords are one event with multiple notes. The viewport renders one visual block per chord pitch.

## Instructional timing

Foundational drills may use generated instructional timing. The Phase A seed migration persists `finger-placement` and `beginner-chords` as canonical instructional timelines.

Default template:

- `templateId`: `foundational-quarter-note-v1`
- `originalBpm`: `60`
- `timeSignature`: `4/4`
- `countInBeats`: `4`
- `firstEventBeat`: `0`
- `eventSpacingBeats`: `2`
- `noteDurationBeats`: `1`
- timing windows: `180 / 350 / 700 ms`
- source type: `instructional-template`
- review status: `instructional`

Instructional timing is valid for drills only. It must not be labelled or presented as original song rhythm.

## Verified song timing

Song phrases and complete songs require approved verified timing from one of:

- MIDI
- sheet music
- reviewed manual transcription
- reviewed recorded-performance capture

Required fields:

- original BPM
- time signature
- event start beats
- event durations
- stable event IDs
- source type
- `reviewStatus: "approved"`

`complete-ode-to-joy` is the only approved verified song timeline in Phase A. Its provenance is stored as `manual-transcription` with approved review status.

## Blocked migration state

Unverified song and melody lessons are persisted as:

```ts
{
  mode: "migration-blocked",
  contentKind: "song-phrase" | "complete-song",
  migrationStatus: "needs-transcription",
  unavailableReason: "...",
  requiredTimingSource: "...",
  legacySteps: []
}
```

`legacySteps` are retained only for transcription and audit support. Normal learner routes do not render them through the old guided-step player.

## Migration workflow

Run the read-only audit:

```bash
npm run audit:songs -w @piano360/api
```

Before unblocking a song lesson:

1. Confirm the legal/source basis.
2. Capture or transcribe beat positions and durations.
3. Group simultaneous chord pitches into one event.
4. Add source provenance and reviewer metadata.
5. Set `reviewStatus: "approved"`.
6. Run validation and tests.

Persisted database migration commands remain a follow-up phase. Do not reset production data to apply seed changes.
