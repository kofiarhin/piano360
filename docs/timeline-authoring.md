# Timeline lesson authoring

Timeline lessons use beat-based musical events. Milliseconds are derived at runtime from the learner's selected practice BPM; changing tempo never rewrites event positions or durations.

## Lesson format

```ts
{
  mode: "timeline",
  timeline: {
    originalBpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    countInBeats: 4,
    totalBeats: 16,
    events: [
      {
        id: "bar-1-c4",
        type: "note",
        notes: ["C4"],
        startBeat: 0,
        durationBeats: 1,
        hand: "right"
      },
      {
        id: "bar-1-rest",
        type: "rest",
        startBeat: 1,
        durationBeats: 1
      }
    ]
  }
}
```

Chords are a single note event containing multiple pitches. Repeated pitches require separate stable event IDs. Events must be ordered by `startBeat`, durations must be positive, and every event must end on or before `totalBeats`.

## Source policy

Use reviewed MIDI, sheet music, or manual transcription as the timing source. An ordered note list does not contain enough information to infer rhythm and must remain `guided-steps` until it is transcribed.

Run the read-only catalogue audit with:

```bash
npm run audit:songs -w @piano360/api
```

The current seed contains 35 course-level songs or studies, not the 50 expected in the original request. The audit derives its record count from the catalogue and flags this discrepancy in its JSON output.

## Version-one assumptions

- One BPM applies to the entire timeline. Tempo maps are deferred; do not flatten a known tempo change into inaccurate data.
- `durationBeats` represents the authored sounding duration. Sustain-pedal events and key-release validation are deferred.
- Pickup notes can use a shortened first measure while keeping non-negative beat positions. `countInBeats` is separate from authored song beats.
- Practice tempo is stored per lesson in local storage and defaults to 60%.
- Large tempo changes pause the transport before applying the new BPM.

## Migration checklist

1. Confirm the source and licensing status.
2. Transcribe note onsets and durations in beats.
3. Group simultaneous chord pitches into one event.
4. Set the original BPM, time signature, count-in, and total beats.
5. Run API validation and the catalogue audit.
6. Verify playback at 50%, 60%, 80%, and 100%.
7. Test guided and performance modes at desktop and mobile landscape sizes.
