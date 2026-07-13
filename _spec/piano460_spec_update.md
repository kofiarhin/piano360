# Piano360 Universal Guided Timeline Specification

**Status:** Canonical source of truth  
**Repository:** `kofiarhin/piano360`  
**Version:** 2.0  
**Supersedes:** The dual `guided-steps` and `timeline` learner-facing architecture in version 1.0  
**Primary decision:** Every playable lesson MUST use the guided timeline player.  

---

## 1. Source-of-Truth Statement

This document defines the required product behaviour, content model, migration rules, frontend architecture, backend validation, testing expectations, and rollout plan for Piano360.

Where existing code, seed data, documentation, or previous specifications conflict with this document, this document takes precedence until formally amended.

The learner-facing single-note step player is deprecated. It MAY remain temporarily as an internal compatibility path while legacy lesson data is migrated, but it MUST NOT remain the default or intended learner experience.

---

## 2. Product Vision

Piano360 is a guided-play piano learning application.

Every playable lesson MUST teach both:

- which piano keys to play
- when those keys should be played

Every lesson MUST present a consistent guided timeline interface containing:

- a fixed playhead or judgement line
- upcoming notes or chords
- beat-based rhythmic spacing
- visible note durations
- BPM and tempo controls
- count-in
- piano input
- guided pause-on-miss recovery
- progress and completion feedback

The learner must encounter the same core interaction model from the first note-recognition exercise through complete-song performance.

The lesson content changes in complexity, but the player does not.

---

## 3. Problem Statement

The current learner-facing experience frequently displays one target at a time:

```text
C4
1/12
Play the highlighted note
```

This teaches note location but does not build rhythmic understanding. A learner can wait indefinitely between notes, so a song or exercise does not preserve timing, duration, rests, pulse, or phrasing.

The existing repository contains a timeline prototype, but most lessons are still represented as sequential `steps`. Consequently, most production routes continue to render the legacy single-note player.

The product must move to one universal timeline engine so that:

1. foundational exercises use simple instructional timing
2. song phrases use verified musical timing
3. complete songs use verified musical timing
4. every learner sees a playhead and upcoming events
5. missed notes trigger guided recovery by default
6. performance mode remains available for complete songs and assessment

---

## 4. Approved Product Decisions

### 4.1 One learner-facing player

Piano360 MUST use one universal `TimelinePlayer` for every playable lesson.

The application MUST NOT maintain two separate learner experiences such as:

```text
GuidedStepPlayer
TimelinePlayer
```

The target architecture is:

```text
TimelinePlayer
├── Transport
├── Count-in
├── Timeline viewport
├── Judgement line
├── Piano
├── Input normalization
├── Timing judgement
├── Guided recovery
├── Tempo control
├── Metronome
├── Looping
├── Scoring
└── Completion
```

### 4.2 Guided timeline is the default

Every lesson MUST default to guided timeline behaviour.

In guided timeline behaviour:

- the playhead moves according to BPM
- notes approach the judgement line
- the learner plays the expected note or chord
- if the event is missed, the transport pauses
- the required note or chord remains highlighted
- the learner completes the missed event
- playback resumes after a short recovery sequence

### 4.3 Performance mode is optional

Timeline lessons MAY expose a continuous performance mode.

Performance mode is primarily intended for:

- complete songs
- assessment
- advanced practice
- full-run rehearsal

Performance mode MUST continue through mistakes and record misses without pausing.

### 4.4 Legacy guided steps are migration input only

The existing `guided-steps` model MAY temporarily remain in the API and database to support migration.

It MUST be treated as legacy input, not a permanent learner-facing product mode.

When a legacy lesson is loaded, the application SHOULD convert it into an instructional timeline before rendering.

The old single-note player MUST be removed from normal learner routing after migration acceptance criteria are met.

---

## 5. Goals

The implementation MUST:

1. Render every playable lesson through the timeline player.
2. Display a fixed judgement line in every lesson.
3. Display upcoming notes and chords before they are due.
4. Represent canonical timing in beats.
5. Support note start positions and durations.
6. Support rests.
7. Support chords.
8. Support adjustable practice tempo.
9. Support count-in.
10. Support guided pause-on-miss recovery.
11. Support optional continuous performance mode.
12. Preserve existing lesson identity, ordering, unlocking, and progress where possible.
13. Convert foundational drills automatically through instructional timing templates.
14. Require verified timing for song phrases and complete songs.
15. Clearly distinguish instructional timing from verified musical timing.
16. Work on desktop, tablet, and mobile landscape.
17. Use one transport clock for audio, visuals, metronome, judgement, and completion.
18. Provide deterministic automated tests.

---

## 6. Non-Goals

The first production release does not require:

- automatic transcription from commercial recordings
- automatic recovery of real rhythm from note names and BPM alone
- full staff notation
- advanced sustain-pedal notation
- multiple time signatures in one lesson
- tempo maps with multiple BPM changes
- automatic fingering generation
- multiplayer
- leaderboards
- teacher dashboards
- mandatory MIDI hardware
- migration of unverified songs as though they contain accurate rhythm

---

## 7. Core Principles

### 7.1 Timeline data drives every lesson

The same timeline MUST drive:

- note placement
- note width
- playhead movement
- current target selection
- metronome
- count-in
- reference playback
- input judgement
- missed-event detection
- guided recovery
- seeking
- looping
- completion

### 7.2 Canonical timing uses beats

Canonical lesson timing MUST be stored in beats, not milliseconds.

Milliseconds are derived at runtime from the selected BPM.

### 7.3 Tempo does not mutate content

Changing practice tempo MUST NOT modify:

- event start beats
- event durations
- rest positions
- event order
- total beats
- original BPM

### 7.4 BPM alone is not sufficient for songs

BPM describes beat speed. It does not determine note placement or duration.

Song phrases and complete songs MUST NOT be migrated by assigning equal timing to every note and presenting that result as authentic rhythm.

### 7.5 Instructional timing is valid for drills

Foundational exercises MAY use generated timing because their purpose is controlled repetition rather than reproduction of a known song.

Generated timing MUST be labelled `instructional`.

### 7.6 Verified timing is required for songs

Song phrases and complete songs MUST use timing derived from one of:

- verified MIDI
- verified sheet music
- reviewed manual transcription
- reviewed performance capture

---

## 8. Lesson Classification

Every lesson MUST be classified by content purpose.

```ts
type LessonContentKind =
  | "foundational-drill"
  | "rhythm-drill"
  | "song-phrase"
  | "complete-song";
```

### 8.1 Foundational drill

Examples:

- locate middle C
- identify white keys
- finger placement
- repeat one note
- build a chord shape
- move between two chords

Timing source:

```ts
"instructional"
```

Default behaviour:

```ts
"guided"
```

### 8.2 Rhythm drill

Examples:

- quarter-note repetition
- eighth-note alternation
- syncopation exercise
- chord-on-the-beat exercise

Timing source:

```ts
"instructional" | "verified"
```

Default behaviour:

```ts
"guided"
```

### 8.3 Song phrase

Timing source:

```ts
"verified"
```

Default behaviour:

```ts
"guided"
```

Performance mode MAY be available.

### 8.4 Complete song

Timing source:

```ts
"verified"
```

Default behaviour MAY be guided for beginners, but performance mode MUST be available.

---

## 9. Canonical Lesson Model

All newly authored lessons MUST contain a timeline.

```ts
type Lesson = {
  slug: string;
  title: string;
  description: string;
  order: number;
  isFinal: boolean;
  contentKind: LessonContentKind;
  defaultPracticeMode: TimelinePracticeMode;
  availablePracticeModes: TimelinePracticeMode[];
  timeline: SongTimeline;
};
```

```ts
type TimelinePracticeMode = "guided" | "performance";
```

### 9.1 Validation rules

A new lesson MUST be invalid when:

- `timeline` is absent
- `availablePracticeModes` is empty
- `defaultPracticeMode` is not included in `availablePracticeModes`
- a `song-phrase` uses unverified instructional timing
- a `complete-song` uses unverified instructional timing

### 9.2 Legacy compatibility shape

During migration only, the API MAY accept:

```ts
type LegacyGuidedLesson = {
  slug: string;
  title: string;
  description: string;
  order: number;
  isFinal: boolean;
  mode?: "guided-steps";
  steps: LessonStep[];
};
```

The client MUST NOT route this shape to the old player.

It MUST pass it through the instructional timeline adapter.

---

## 10. Timeline Model

```ts
type SongTimeline = {
  schemaVersion: 2;
  timingSource: TimelineTimingSource;
  originalBpm: number;
  timeSignature: TimeSignature;
  countInBeats: number;
  totalBeats: number;
  pickupBeats?: number;
  events: TimelineEvent[];
  source: TimelineSourceMetadata;
  instructionalTemplate?: InstructionalTimingTemplate;
};
```

```ts
type TimelineTimingSource = "instructional" | "verified";
```

```ts
type TimeSignature = {
  numerator: number;
  denominator: 2 | 4 | 8 | 16;
};
```

---

## 11. Timeline Events

```ts
type TimelineEvent = TimedNoteEvent | TimedRestEvent;
```

```ts
type TimedNoteEvent = {
  id: string;
  type: "note";
  notes: NoteId[];
  startBeat: number;
  durationBeats: number;
  hand?: "left" | "right" | "both";
  velocity?: number;
  instruction?: string;
  fingerNumbers?: number[];
};
```

```ts
type TimedRestEvent = {
  id: string;
  type: "rest";
  startBeat: number;
  durationBeats: number;
  instruction?: string;
};
```

### 11.1 Chords

A chord MUST be represented as one note event containing multiple pitches.

```ts
{
  id: "c-major-01",
  type: "note",
  notes: ["C4", "E4", "G4"],
  startBeat: 4,
  durationBeats: 2,
  hand: "right"
}
```

### 11.2 Repeated notes

Repeated pitches MUST remain separate events with stable IDs.

### 11.3 Note duration

`durationBeats` controls:

- visual note width
- reference note length
- release timing
- sustain expectation where applicable

---

## 12. Instructional Timeline Templates

Foundational drills MAY be generated from legacy steps using an explicit template.

```ts
type InstructionalTimingTemplate = {
  templateId: string;
  eventSpacingBeats: number;
  noteDurationBeats: number;
  firstEventBeat: number;
  restBetweenGroupsBeats?: number;
  originalBpm: number;
  countInBeats: number;
  timingWindows: TimingWindows;
};
```

### 12.1 Default foundational template

Recommended initial default:

```ts
const foundationalTemplate: InstructionalTimingTemplate = {
  templateId: "foundational-quarter-note-v1",
  eventSpacingBeats: 2,
  noteDurationBeats: 1,
  firstEventBeat: 0,
  originalBpm: 60,
  countInBeats: 4,
  timingWindows: {
    perfectMs: 180,
    goodMs: 350,
    acceptedMs: 700
  }
};
```

This creates a slow, readable exercise with generous response time.

### 12.2 Generated event algorithm

For each legacy step at index `i`:

```ts
startBeat = firstEventBeat + i * eventSpacingBeats;
durationBeats = noteDurationBeats;
notes = step.targetNotes;
instruction = step.instruction;
```

The resulting timeline MUST include:

```ts
timingSource: "instructional"
```

### 12.3 Template selection

Different drill templates MAY be created for:

- note-location drills
- repeated-note drills
- chord-shape drills
- chord-transition drills
- ascending and descending patterns
- call-and-response exercises

Templates MUST be named, versioned, deterministic, and tested.

### 12.4 No authenticity claim

Instructional timelines MUST NOT be labelled as original song rhythm.

The learner-facing UI MAY display:

```text
Instructional timing
```

when relevant.

---

## 13. Verified Song Timing

Song phrases and complete songs MUST contain verified beat positions and durations.

### 13.1 Required source metadata

```ts
type TimelineSourceMetadata = {
  type:
    | "instructional-template"
    | "midi"
    | "sheet-music"
    | "manual-transcription"
    | "recorded-performance";
  reference?: string;
  importedAt?: string;
  importedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewStatus: "unreviewed" | "reviewed" | "approved";
};
```

For `song-phrase` and `complete-song`:

```ts
reviewStatus MUST equal "approved".
```

### 13.2 Required musical fields

Every verified song timeline MUST include:

- verified original BPM
- verified time signature
- note start beats
- note durations
- rests where musically required
- chords grouped correctly
- stable event IDs
- source provenance

---

## 14. Universal Player Behaviour

Every lesson route MUST render the same high-level UI:

```text
Lesson header
Practice mode
Tempo and BPM
Transport controls
Count-in state
Timeline viewport
Fixed judgement line
Now / Next feedback
Virtual piano
Session metrics
Completion summary
```

### 14.1 Initial load

1. Fetch and validate the lesson.
2. Convert legacy steps to an instructional timeline if necessary.
3. Prepare audio after user interaction.
4. Load saved lesson preferences.
5. Render the timeline before playback.
6. Keep transport idle until the learner starts.

### 14.2 Start

1. Unlock audio.
2. Reset to count-in start.
3. Begin audible and visual count-in.
4. Start the timeline at beat zero.
5. Activate input judgement.

### 14.3 Default guided behaviour

The default mode MUST be guided unless the lesson explicitly defines another approved default.

### 14.4 Completion

The lesson completes when:

- the transport reaches `totalBeats`
- no guided recovery is active
- final metrics are calculated
- progress is persisted or queued for persistence

---

## 15. Transport Engine

The transport MUST be the single authority for musical time.

React rendering MUST NOT be the canonical clock.

### 15.1 Required states

```ts
type TransportState =
  | "idle"
  | "preparing"
  | "counting-in"
  | "playing"
  | "paused"
  | "guided-recovery"
  | "seeking"
  | "completed"
  | "error";
```

### 15.2 Required interface

```ts
interface TimelineTransport {
  prepare(): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
  restart(): void;
  stop(): void;
  seek(beat: number): void;
  setBpm(bpm: number): void;
  setLoop(range: LoopRange): void;
  clearLoop(): void;
  getCurrentBeat(): number;
  getState(): TransportState;
  subscribe(listener: TransportListener): () => void;
}
```

### 15.3 Clock implementation

Tone.js or an equivalent audio-grade clock MUST own transport time.

`requestAnimationFrame` MAY sample transport position to update visuals.

### 15.4 Pause

Pausing MUST:

- preserve the current beat
- stop or clear future scheduled audio
- release active notes safely
- preserve prior judgements

### 15.5 Restart

Restart MUST:

- release active notes
- clear scheduled audio
- reset session judgement state
- return to negative count-in beat
- increment restart count

### 15.6 Tempo change

Changing BPM MUST:

1. pause playback
2. preserve the current beat
3. clear future scheduling
4. update BPM
5. reschedule remaining events
6. remain paused until explicit resume

---

## 16. Count-In

Every lesson MUST support count-in.

The default count-in SHOULD be four beats unless lesson content specifies otherwise.

Count-in MUST include:

- visual countdown
- audible click
- selected BPM
- emphasized final count or first downbeat
- clean transition into beat zero

Count-in MUST occur:

- on first play
- after restart
- after guided recovery when configured
- on loop restart when configured

---

## 17. Tempo Controls

Every lesson MUST display tempo controls.

Initial presets:

- 50%
- 60%
- 70%
- 80%
- 90%
- 100%

The UI MUST display both percentage and BPM.

Example:

```text
70% · 84 BPM
```

```ts
selectedBpm = originalBpm * tempoPercent / 100;
```

Selected tempo MUST be persisted per lesson.

---

## 18. Timeline Rendering

### 18.1 Fixed judgement line

The judgement line MUST remain fixed, preferably around 30% from the left edge.

### 18.2 Event positioning

```ts
x = event.startBeat * pixelsPerBeat;
width = event.durationBeats * pixelsPerBeat;
```

### 18.3 Timeline translation

```ts
offset = judgementLineX - currentBeat * pixelsPerBeat;
```

### 18.4 Chord rendering

Chord pitches MUST be shown as vertically aligned blocks sharing one event ID.

### 18.5 Required visual states

- upcoming
- current target
- waiting in guided recovery
- correct
- perfect
- good
- accepted
- early
- late
- missed
- wrong
- completed

Feedback MUST NOT rely only on colour.

### 18.6 Foundational lesson readability

Foundational drills MUST still show upcoming events even when only one note is currently actionable.

The screen MUST NOT collapse back into a single isolated note prompt.

### 18.7 Responsive behaviour

The timeline MUST remain visible on:

- desktop
- tablet
- mobile landscape

The piano and essential controls MUST remain usable without page-level horizontal overflow.

---

## 19. Input Architecture

All input sources MUST normalize to one event type.

```ts
type PianoInputEvent = {
  note: NoteId;
  occurredAt: number;
  source: "computer-keyboard" | "touch" | "midi";
  action: "note-on" | "note-off";
  velocity?: number;
};
```

Version 1 MUST support:

- computer keyboard
- on-screen piano

The architecture SHOULD remain compatible with future Web MIDI input.

Repeated keydown events MUST be ignored.

Editable controls MUST not trigger piano notes.

Multi-touch SHOULD support chords.

---

## 20. Timing Judgement

```ts
type TimingClassification =
  | "perfect"
  | "good"
  | "accepted"
  | "early"
  | "late"
  | "wrong"
  | "missed"
  | "recovered";
```

### 20.1 Configurable windows

```ts
type TimingWindows = {
  perfectMs: number;
  goodMs: number;
  acceptedMs: number;
};
```

Foundational instructional lessons SHOULD use wider windows than verified song lessons.

### 20.2 Event matching

The judgement engine MUST:

1. find unresolved events near current transport time
2. prefer matching pitches
3. choose the closest eligible event
4. prevent duplicate scoring
5. handle repeated notes deterministically
6. handle chords as event sets

### 20.3 Miss detection

An event becomes missed after its late accepted boundary passes without valid input.

In guided mode, the miss triggers recovery.

In performance mode, the transport continues.

---

## 21. Guided Recovery

Guided recovery is mandatory for the default lesson experience.

### 21.1 Recovery flow

1. The event passes its accepted timing window.
2. Record the event as missed.
3. Pause the transport.
4. Set transport state to `guided-recovery`.
5. Keep the missed event aligned with or near the judgement line.
6. Highlight required piano keys.
7. Show the event instruction.
8. Accept the correct note or chord.
9. Record the result as `recovered`.
10. Show confirmation for approximately 300–500ms.
11. Perform a short count-in when configured.
12. Resume from the next unresolved event.

### 21.2 Recovery scoring

Recovered input MUST NOT be scored as perfect, good, or accepted timing.

It MAY count toward pitch completion while remaining a rhythmic miss.

### 21.3 Wrong recovery input

Wrong notes during recovery MUST:

- sound normally
- display wrong feedback
- leave recovery active
- not advance the timeline

### 21.4 Chord recovery

For a chord:

- all required notes MUST be collected
- missing notes remain highlighted
- invalid extra notes produce wrong feedback
- transport resumes only after the full chord is complete

---

## 22. Performance Mode

Performance mode MUST:

- continue through misses
- record wrong notes
- keep later events scoreable
- never enter guided recovery automatically
- complete at the timeline end

Switching practice mode during playback MUST pause the transport.

The selected mode SHOULD be persisted per lesson.

---

## 23. Reference Playback and Metronome

### 23.1 Reference playback

The player SHOULD support:

```ts
type ReferencePlaybackMode =
  | "off"
  | "melody"
  | "metronome"
  | "melody-and-metronome";
```

Reference notes MUST be scheduled from timeline beats and durations.

### 23.2 Metronome

The metronome MUST:

- share the transport clock
- follow selected BPM
- accent measure downbeats
- work during count-in
- remain synchronized after pause and seek
- persist preference

---

## 24. Seeking and Looping

### 24.1 Seeking

Seeking MUST:

1. pause transport
2. stop active notes
3. clear future scheduling
4. clear active chord collection
5. clear guided recovery
6. update transport position
7. reset judgements at and after target beat
8. recalculate the next event
9. remain paused

Events skipped manually MUST NOT be counted as misses.

### 24.2 Looping

```ts
type LoopRange = {
  startBeat: number;
  endBeat: number;
};
```

Loop boundaries SHOULD snap to measures by default.

At loop end, the player MUST reset loop-contained judgement state and return to loop start safely.

---

## 25. Metrics

Every attempt SHOULD calculate:

- expected event count
- correct pitch count
- missed count
- recovered count
- wrong-note count
- perfect count
- good count
- accepted count
- early count
- late count
- pitch accuracy
- rhythmic accuracy
- combined accuracy
- mean absolute timing error
- signed mean timing error
- longest streak
- selected BPM
- tempo percentage
- practice mode
- musical duration
- wall-clock practice duration
- restart count

Recovered events MAY count toward pitch completion but MUST remain rhythmically missed.

---

## 26. Progress Persistence

Persist per lesson:

- completion state
- latest attempt
- best attempt by tempo
- highest completed tempo
- last tempo
- last practice mode
- metronome preference
- reference playback preference
- total practice time

Legacy guided-step progress SHOULD be mapped by stable lesson slug.

Malformed stored progress MUST fail safely without crashing the lesson.

---

## 27. Migration Architecture

### 27.1 Legacy adapter

Create a deterministic adapter:

```ts
convertLegacyLessonToInstructionalTimeline(
  lesson: LegacyGuidedLesson,
  template: InstructionalTimingTemplate
): Lesson
```

The adapter MUST preserve:

- lesson slug
- title
- description
- order
- final status
- step IDs as stable event IDs where possible
- target notes
- instructions

### 27.2 Backend migration

A migration script MUST convert persisted legacy lessons to timeline schema version 2.

The migration MUST:

- create a backup first
- validate the source database name
- support dry run
- produce a report
- be idempotent
- avoid overwriting verified timelines
- preserve stable identifiers

### 27.3 Runtime fallback

Until persisted migration is complete, the client MAY adapt legacy lessons at runtime.

Runtime adaptation MUST be temporary and covered by telemetry or audit reporting so remaining legacy lessons can be identified.

### 27.4 Learner routing

`LessonPlayer` MUST route every valid playable lesson to `TimelinePlayer`.

The legacy `PlayerLoaded` single-step UI MUST NOT be used after the universal timeline feature flag is enabled.

---

## 28. Content Migration Rules

### 28.1 Foundational drills

May be generated automatically using instructional templates.

Examples:

- finger placement
- note recognition
- chord construction
- chord transitions
- keyboard geography

### 28.2 Song phrases

Must be manually verified or source-derived.

### 28.3 Complete songs

Must be manually verified or source-derived.

### 28.4 Audit status

```ts
type MigrationStatus =
  | "legacy"
  | "generated-instructional"
  | "needs-transcription"
  | "needs-review"
  | "approved";
```

No song lesson may reach production timeline status until `approved`.

---

## 29. API and Validation

The API MUST return one canonical lesson shape for new content.

Zod and Mongoose validation MUST enforce:

- supported schema version
- finite BPM
- positive BPM
- valid time signature
- non-negative starts
- positive durations
- valid note IDs
- unique event IDs
- deterministic ordering
- event end within total beats
- valid timing source
- approved provenance for song content
- non-empty available practice modes
- valid default practice mode

The API MUST NOT expose a canonical tempo mutation endpoint. Learner-selected tempo is session/progress state.

---

## 30. Frontend Architecture

Recommended structure:

```text
apps/client/src/features/courses/timeline/
├── TimelinePlayer.tsx
├── TimelineViewport.tsx
├── TimelineNote.tsx
├── JudgementLine.tsx
├── MeasureGrid.tsx
├── TransportControls.tsx
├── TempoControl.tsx
├── PracticeModeControl.tsx
├── MetronomeControl.tsx
├── ReferencePlaybackControl.tsx
├── LoopControl.tsx
├── CountInOverlay.tsx
├── TimelineFeedback.tsx
├── TimelineCompletionSummary.tsx
├── legacyLessonAdapter.ts
├── instructionalTemplates.ts
├── useTimelineTransport.ts
├── useTimelineInput.ts
├── useTimelineJudgement.ts
├── useTimelineAudio.ts
├── timelineTransport.ts
├── timelineMath.ts
├── timingJudge.ts
├── scoring.ts
├── timelineStorage.ts
└── timelineTypes.ts
```

### 30.1 Responsibility rules

`TimelinePlayer` coordinates modules but MUST NOT contain low-level clock or judgement algorithms.

`timelineTransport` MUST remain independent from React.

`timingJudge` MUST be deterministic and independently testable.

`legacyLessonAdapter` MUST contain all temporary step-to-timeline conversion rules.

API logic MUST remain outside presentation components.

TanStack Query MUST continue to manage server state.

---

## 31. Deprecation Plan

### Phase A: Universal rendering

- Add legacy-to-instructional adapter.
- Route every lesson to `TimelinePlayer`.
- Keep legacy schemas readable.
- Hide legacy single-note UI from learners.

### Phase B: Persisted migration

- Convert all foundational lessons to instructional timelines.
- Convert verified song lessons to approved timelines.
- Audit remaining legacy lessons.

### Phase C: Removal

Remove only after all acceptance criteria pass:

- legacy learner-facing player
- guided-step routing branch
- step-specific session engine where no longer required
- duplicate completion UI
- duplicate keyboard-input orchestration

Legacy data readers MAY remain for one additional compatibility release.

---

## 32. Accessibility

Every timeline lesson MUST support:

- keyboard operation
- visible focus
- screen-reader labels
- live feedback announcements
- non-colour status indicators
- reduced motion
- high contrast
- accessible tempo controls
- accessible seek controls
- minimum 44px touch targets
- clear count-in announcements

Reduced-motion mode MUST preserve timing comprehension even if movement is simplified.

---

## 33. Mobile Landscape

Mobile landscape MUST show:

- essential transport controls
- tempo
- timeline
- judgement line
- target feedback
- playable piano

The layout MUST NOT hide the timeline in foundational lessons.

Orientation changes MUST NOT reset:

- current beat
- selected tempo
- practice mode
- judgement state
- guided recovery state

---

## 34. Testing Requirements

### 34.1 Adapter tests

Test:

- one-note step conversion
- chord step conversion
- stable IDs
- generated start beats
- generated durations
- preserved instructions
- deterministic output
- instructional source labels

### 34.2 Timeline math tests

Test:

- BPM conversion
- beat-to-time
- time-to-beat
- beat-to-pixel
- measure calculation

### 34.3 Transport tests

Test:

- count-in
- play
- pause
- resume
- restart
- tempo change
- seek
- loop
- completion
- guided recovery state

### 34.4 Judgement tests

Test:

- perfect
- good
- accepted
- early
- late
- wrong
- missed
- recovered
- repeated notes
- chords
- duplicate input suppression

### 34.5 Component tests

Test:

- every legacy lesson renders the timeline player
- upcoming notes are visible
- judgement line is visible
- tempo controls are visible
- foundational lessons pause on miss
- chord recovery requires all notes
- performance mode continues
- completion summary renders

### 34.6 Backend tests

Test:

- schema version 2
- instructional timeline validity
- verified song validity
- song rejection without approved provenance
- invalid BPM
- invalid durations
- duplicate event IDs
- unsupported notes
- migration idempotency

### 34.7 End-to-end tests

Required scenarios:

1. Open finger placement and see a playhead.
2. Open C major chord and see upcoming chord events.
3. Start count-in.
4. Miss an event and enter guided recovery.
5. Complete recovery and resume.
6. Change tempo.
7. Seek and replay.
8. Open a song phrase and see verified timing.
9. Complete a song in guided mode.
10. Complete a song in performance mode.
11. Reload and restore preferences.
12. Verify mobile landscape.

---

## 35. Rollout Plan

### Phase 0: Safety

- remove unrelated database exports from the repository
- verify environment isolation
- safeguard migration scripts
- back up the correct Piano360 database

### Phase 1: Universal timeline adapter

- implement instructional templates
- implement legacy adapter
- route all lessons to timeline player
- add regression tests

Exit criterion:

Every current lesson route displays a timeline and playhead.

### Phase 2: Guided recovery completion

- complete pause-on-miss flow
- complete chord recovery
- add recovery count-in
- ensure correct resume position

### Phase 3: Transport hardening

- use Tone.js transport as musical authority
- synchronize audio and visuals
- harden pause, restart, seek, and tempo changes

### Phase 4: Foundational persisted migration

- migrate finger placement
- migrate note recognition
- migrate chord lessons
- migrate chord transitions
- verify generated instructional timing

### Phase 5: Song migration

- audit song phrases and complete songs
- obtain verified sources
- author and approve timelines
- migrate in reviewed batches

### Phase 6: Legacy removal

- remove learner-facing single-step player
- remove obsolete routing
- remove duplicate session logic
- retain temporary data compatibility reader if required

---

## 36. Acceptance Criteria

The universal guided timeline redesign is complete when:

### Universal experience

- Every playable lesson route renders `TimelinePlayer`.
- Every lesson displays a judgement line.
- Every lesson displays upcoming notes or chords.
- Every lesson displays BPM and tempo controls.
- Every lesson supports count-in.
- No normal learner route displays only one isolated note prompt without a timeline.

### Foundational lessons

- Legacy steps convert deterministically to instructional timelines.
- Generated timelines are labelled instructional.
- Timing windows are generous.
- Missed events pause the transport.
- Chord drills display stacked chord notes.
- Chord recovery requires the full chord.

### Song lessons

- Song phrases use approved verified timing.
- Complete songs use approved verified timing.
- BPM alone is never used to fabricate rhythm.
- Note spacing and duration match the reviewed source.

### Transport

- One transport controls audio, visuals, count-in, metronome, and judgement.
- Pause preserves beat position.
- Restart returns to count-in.
- Tempo changes preserve musical position.
- Seek resets affected judgement state.
- No stuck notes remain after transport actions.

### Guided recovery

- A missed event pauses playback.
- The required note or chord remains visible.
- Correct recovery is accepted.
- Recovery is not scored as rhythmically perfect.
- Playback resumes from the correct next event.

### Performance mode

- Performance mode is available where configured.
- Mistakes do not pause playback.
- Later events remain scoreable.

### Compatibility

- Existing lesson slugs and course order remain stable.
- Existing progress is mapped where possible.
- Legacy data can be read during migration.
- The old learner-facing player is deprecated and removed after migration.

### Quality

- Frontend unit and component tests pass.
- Backend validation tests pass.
- Required end-to-end tests pass.
- Desktop and mobile landscape are usable.
- Accessibility requirements pass review.

---

## 37. Definition of Done

Piano360 has completed this architectural transition when the product behaves as a guided-play application at all times:

1. Every playable lesson has a timeline.
2. Every lesson displays a fixed playhead or judgement line.
3. Every lesson shows upcoming notes or chords.
4. Foundational content uses explicit instructional timing.
5. Song content uses approved verified timing.
6. Guided pause-on-miss is the default behaviour.
7. Performance mode is available for suitable lessons.
8. One transport controls all musical time.
9. The legacy single-note player is no longer learner-facing.
10. Existing content has been migrated or is adapted deterministically.
11. The full system is covered by automated tests.

This version is the authoritative specification for Piano360 going forward.