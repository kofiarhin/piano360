# Piano360 Rhythm Timeline System Specification

**Status:** Source of truth
**Repository:** `kofiarhin/piano360`
**Version:** 1.0
**Purpose:** Define the original product and technical requirements for transforming Piano360 from a sequential note-prompt application into a rhythm-aware piano learning system.

---

# 1. Product Vision

Piano360 must teach learners both:

- **which piano keys to play**
- **when those keys should be played**

The current lesson experience successfully teaches note recognition by showing one note or chord at a time and waiting for the correct input. This works for drills, but it does not preserve the rhythm, pace, rests, note lengths, or phrasing of complete songs.

The redesigned system must introduce a beat-based timeline where musical events move toward a fixed playhead or judgement line. When an event reaches that line, the learner plays the corresponding piano key or chord.

The learner must be able to slow down or increase the tempo without changing the song’s relative rhythmic structure.

---

# 2. Problem Statement

The existing lesson data primarily represents songs as ordered note sequences.

Example:

```ts
["G4", "A4", "B4", "A4", "G4", "E4"];
```

This data communicates note order but does not communicate:

- when each note begins
- how long each note lasts
- where rests occur
- whether notes are quarter notes, eighth notes, dotted notes, or sustained notes
- whether notes occur on or between beats
- whether multiple notes form a chord
- where measures begin
- the song’s tempo
- the song’s time signature

As a result, the learner presses correct notes in sequence, but the result does not sound like the intended song.

The current guided engine advances immediately after a correct input rather than according to musical time.

---

# 3. Goals

The system must:

1. Preserve the existing guided note-learning experience.
2. Add a rhythm-aware timeline lesson mode.
3. Store musical timing in beats.
4. Store each song’s original BPM.
5. Allow learners to select a slower or faster practice tempo.
6. Preserve relative rhythm at every selected tempo.
7. Display upcoming notes on a horizontally scrolling timeline.
8. Use a fixed playhead or judgement line.
9. Support note durations, rests, chords, and repeated notes.
10. Judge both pitch and timing.
11. Support beginner-friendly guided practice.
12. Support continuous performance practice.
13. Allow pause, restart, seeking, looping, count-in, and metronome.
14. Audit and migrate existing song data.
15. Maintain compatibility with existing lessons.
16. Work on desktop and mobile landscape layouts.

---

# 4. Non-Goals

The first release does not include:

- automatic song transcription from commercial audio
- automatic rhythm generation from note names alone
- full sheet-music engraving
- advanced sustain-pedal notation
- automatic fingering generation
- teacher dashboards
- multiplayer
- leaderboards
- mandatory MIDI keyboard support
- multiple tempo changes inside one song
- multiple time signatures inside one song
- complete migration of every existing song before the first release

---

# 5. Core Product Principles

## 5.1 Two lesson modes must coexist

Piano360 must support:

```ts
type LessonMode = "guided-steps" | "timeline";
```

The existing step-based system must not be removed.

## 5.2 BPM alone is insufficient

BPM specifies how quickly beats occur.

It does not specify where individual notes occur.

The application must not claim that a song has accurate rhythm unless it has:

- note start beats
- note durations
- rests where required
- verified BPM
- verified time signature

## 5.3 Canonical timing is stored in beats

The database must not store canonical song timing as absolute milliseconds.

Beat-based data allows the same timeline to work at multiple tempos.

## 5.4 Tempo changes do not alter musical structure

Changing practice tempo must only change how quickly the transport moves through the timeline.

It must not modify:

- event order
- event start beats
- event durations
- rests
- total beats
- original BPM

## 5.5 One timeline is the source of truth

The same timeline must drive:

- visual note positions
- playhead movement
- reference audio
- metronome
- count-in
- input judgement
- missed-note detection
- seeking
- looping
- completion

---

# 6. Lesson Modes

## 6.1 Guided Steps

`guided-steps` is used for exercises where the learner can take unlimited time.

Examples:

- finding middle C
- locating specific keys
- learning chord shapes
- finger-placement exercises
- basic note-recognition drills

Behaviour:

1. Show the expected note or chord.
2. Wait for learner input.
3. Mark incorrect input.
4. Continue waiting.
5. Advance after the correct input.
6. Do not judge rhythm.

The current lesson structure already supports this model through `LessonStep`.

## 6.2 Timeline

`timeline` is used when musical timing matters.

Examples:

- song phrases
- complete songs
- rhythm exercises
- tempo exercises
- performance assessment

Behaviour:

1. Prepare audio.
2. Begin a count-in.
3. Move the timeline according to selected BPM.
4. Display notes approaching a fixed judgement line.
5. Judge learner input against expected pitch and time.
6. Continue or pause depending on practice mode.
7. Complete when the timeline reaches the end.

---

# 7. Timeline Practice Modes

Timeline lessons contain two practice behaviours.

```ts
type TimelinePracticeMode = "guided" | "performance";
```

## 7.1 Guided Timeline Mode

This mode introduces timing while still helping beginners recover from mistakes.

When a note is missed:

1. The timeline pauses.
2. The missed event remains highlighted.
3. The expected key or chord is highlighted on the piano.
4. The learner plays the correct pitch.
5. The recovery input is recorded.
6. A short confirmation appears.
7. The timeline resumes from the next musical event.

Recovery input must not receive a normal rhythm score because it was played after the timeline paused.

## 7.2 Performance Timeline Mode

This mode measures continuous performance.

When a note is missed:

- the timeline continues
- the event is recorded as missed
- later notes remain playable and scoreable
- the song completes at the natural end

Performance mode must never pause automatically because of a learner mistake.

---

# 8. Canonical Lesson Data Model

## 8.1 Shared lesson fields

```ts
type LessonBase = {
  slug: string;
  title: string;
  description: string;
  order: number;
  isFinal: boolean;
};
```

## 8.2 Guided lesson

```ts
type GuidedStepLesson = LessonBase & {
  mode: "guided-steps";
  steps: LessonStep[];
  timeline?: never;
};
```

For backward compatibility, missing `mode` may temporarily be interpreted as `guided-steps`.

All newly authored lessons must explicitly include `mode`.

## 8.3 Timeline lesson

```ts
type TimelineLesson = LessonBase & {
  mode: "timeline";
  steps?: never;
  timeline: SongTimeline;
};
```

## 8.4 Lesson union

```ts
type Lesson = GuidedStepLesson | TimelineLesson;
```

A lesson must not contain both active `steps` and active `timeline` data.

---

# 9. Song Timeline Data Model

```ts
type SongTimeline = {
  schemaVersion: 1;
  originalBpm: number;
  timeSignature: TimeSignature;
  countInBeats: number;
  totalBeats: number;
  pickupBeats?: number;
  events: TimelineEvent[];
  source: TimelineSource;
};
```

## 9.1 Schema version

```ts
schemaVersion: 1;
```

The schema version allows future timeline formats to be migrated safely.

## 9.2 Original BPM

`originalBpm` represents the verified baseline tempo of the song or arrangement.

Example:

```ts
originalBpm: 120;
```

## 9.3 Time signature

```ts
type TimeSignature = {
  numerator: number;
  denominator: 2 | 4 | 8 | 16;
};
```

Example:

```ts
timeSignature: {
  numerator: 4,
  denominator: 4
}
```

## 9.4 Count-in

`countInBeats` represents the number of beats heard before beat zero.

Example:

```ts
countInBeats: 4;
```

## 9.5 Total beats

`totalBeats` must cover the end of the final event.

```ts
event.startBeat + event.durationBeats <= totalBeats;
```

## 9.6 Pickup beats

`pickupBeats` optionally represents an anacrusis or pickup before the first full measure.

---

# 10. Timeline Events

```ts
type TimelineEvent = TimedNoteEvent | TimedRestEvent;
```

## 10.1 Note event

```ts
type TimedNoteEvent = {
  id: string;
  type: "note";
  notes: NoteId[];
  startBeat: number;
  durationBeats: number;
  hand?: "left" | "right" | "both";
  velocity?: number;
};
```

## 10.2 Rest event

```ts
type TimedRestEvent = {
  id: string;
  type: "rest";
  startBeat: number;
  durationBeats: number;
};
```

## 10.3 Single-note example

```ts
{
  id: "event-001",
  type: "note",
  notes: ["G4"],
  startBeat: 0,
  durationBeats: 1,
  hand: "right",
  velocity: 0.8
}
```

## 10.4 Eighth-note example

```ts
{
  id: "event-002",
  type: "note",
  notes: ["A4"],
  startBeat: 1,
  durationBeats: 0.5,
  hand: "right"
}
```

## 10.5 Chord example

```ts
{
  id: "event-003",
  type: "note",
  notes: ["C4", "E4", "G4"],
  startBeat: 2,
  durationBeats: 2,
  hand: "right"
}
```

## 10.6 Rest example

```ts
{
  id: "event-004",
  type: "rest",
  startBeat: 4,
  durationBeats: 1
}
```

---

# 11. Data Invariants

Every timeline must satisfy the following rules.

## 11.1 Timeline requirements

- `schemaVersion` must be supported.
- `originalBpm` must be finite and greater than zero.
- `totalBeats` must be finite and greater than zero.
- `countInBeats` must be a non-negative integer.
- `events` must contain at least one note event.
- event IDs must be unique.
- events must be ordered by `startBeat`.
- every event must end at or before `totalBeats`.

## 11.2 Note-event requirements

- `notes` must contain at least one note.
- all notes must be valid `NoteId` values.
- duplicate pitches must not occur inside one event.
- `startBeat` must be non-negative unless pickup handling explicitly permits otherwise.
- `durationBeats` must be greater than zero.
- `velocity`, when present, must be between `0` and `1`.

## 11.3 Rest requirements

- rests must not contain notes
- rest duration must be greater than zero

## 11.4 Event identity

Repeated notes must remain separate events.

This is valid:

```ts
[
  {
    id: "g4-first",
    notes: ["G4"],
    startBeat: 0,
    durationBeats: 1
  },
  {
    id: "g4-second",
    notes: ["G4"],
    startBeat: 1,
    durationBeats: 1
  }
];
```

Pitch alone must never be used as event identity.

---

# 12. Source Provenance

Every production timeline must record where its rhythm data came from.

```ts
type TimelineSource = {
  type:
    | "midi"
    | "sheet-music"
    | "manual-transcription"
    | "recorded-performance"
    | "legacy-note-list"
    | "unknown";
  reference?: string;
  importedAt?: string;
  importedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewStatus: "unreviewed" | "reviewed" | "approved";
};
```

A production timeline must have:

```ts
reviewStatus: "approved";
```

A legacy note list may help identify pitch order, but it must not be considered authoritative timing data.

---

# 13. Beat and Time Conversion

## 13.1 Milliseconds per beat

```ts
millisecondsPerBeat = 60_000 / selectedBpm;
```

## 13.2 Beat to milliseconds

```ts
eventStartMs = event.startBeat * millisecondsPerBeat;
```

## 13.3 Duration in milliseconds

```ts
eventDurationMs = event.durationBeats * millisecondsPerBeat;
```

## 13.4 Example

Original BPM:

```text
120 BPM
```

At 120 BPM:

```text
1 beat = 500ms
```

At 60 BPM:

```text
1 beat = 1000ms
```

A note beginning at beat `3.5` therefore begins:

- at `1750ms` when playing at 120 BPM
- at `3500ms` when playing at 60 BPM

The note remains at beat `3.5` in the database.

---

# 14. Tempo Control

## 14.1 Tempo presets

The initial interface must provide:

- 50%
- 60%
- 70%
- 80%
- 90%
- 100%

## 14.2 Display

The control must display both percentage and BPM.

Example:

```text
70% · 84 BPM
```

## 14.3 Calculation

```ts
selectedBpm = (originalBpm * tempoPercent) / 100;
```

## 14.4 Limits

Recommended bounds:

```ts
const MIN_BPM = 30;
const MAX_BPM = 240;
```

## 14.5 Tempo persistence

The application should persist the last selected tempo per lesson.

## 14.6 Tempo changes

Changing tempo while playing must:

1. Pause the transport.
2. Preserve the current beat.
3. Clear future scheduled audio.
4. Update BPM.
5. Reschedule future events.
6. Leave canonical event data unchanged.
7. Require the learner to resume playback.

---

# 15. Transport Engine

## 15.1 Purpose

The transport controls the progression of musical time.

It is responsible for:

- count-in
- current beat
- playback state
- tempo
- pause
- resume
- restart
- seek
- loops
- completion
- audio scheduling

## 15.2 States

```ts
type TransportState =
  | "idle"
  | "preparing"
  | "counting-in"
  | "playing"
  | "paused"
  | "seeking"
  | "completed"
  | "stopped"
  | "error";
```

## 15.3 Interface

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

## 15.4 Clock ownership

Tone.js or another audio-grade clock must own musical time.

React must not calculate musical progression from render cycles.

`requestAnimationFrame` may read the current transport position for visual updates.

## 15.5 Play

`play()` must:

- unlock audio when necessary
- prepare samples
- begin at the current beat
- perform count-in when applicable
- start reference playback and metronome
- update transport state

## 15.6 Pause

`pause()` must:

- preserve current beat
- stop future scheduled events
- release active notes
- pause metronome
- retain existing judgements

## 15.7 Restart

`restart()` must:

- stop active audio
- clear scheduled events
- reset current beat to `-countInBeats`
- clear active judgement state
- reset completion state
- increment restart count

## 15.8 Completion

A timeline completes when:

- current beat reaches `totalBeats`
- no guided recovery remains active
- the transport is no longer playing

---

# 16. Reference Playback

The learner must be able to control whether the timeline plays an audible reference.

```ts
type ReferencePlaybackMode = "off" | "melody" | "metronome" | "melody-and-metronome";
```

## 16.1 Reference melody

For each note event:

- schedule note-on at `startBeat`
- schedule note-off after `durationBeats`
- apply velocity when present
- schedule all chord pitches at the same beat

## 16.2 Learner input audio

The learner’s own piano input must always remain independent from reference playback.

## 16.3 Volume controls

The architecture should allow separate gain levels for:

- learner piano
- reference melody
- metronome
- count-in

## 16.4 Audio cleanup

All active notes must be released during:

- pause
- seek
- restart
- route change
- component unmount
- browser suspension
- fatal playback error

---

# 17. Count-In

The count-in prepares the learner before the first note.

## 17.1 Example

With four count-in beats:

```text
Beat -4: 4
Beat -3: 3
Beat -2: 2
Beat -1: 1
Beat  0: Play
```

## 17.2 Requirements

The count-in must:

- use the selected BPM
- display a visual countdown
- produce audible clicks
- emphasize the final beat or first downbeat
- transition cleanly into beat zero

## 17.3 Count-in triggers

Count-in must occur:

- on the first play
- after restart
- optionally after guided recovery
- optionally on each loop iteration

---

# 18. Metronome

The metronome must use the same transport clock.

It must:

- click once per beat
- accent the first beat of each measure
- follow selected BPM
- remain synchronized after pause and seek
- support enable and disable
- persist the learner’s preference
- function during count-in

---

# 19. Timeline Visual Design

## 19.1 Judgement line

The playhead or judgement line remains fixed.

Recommended location:

```text
30% from the left edge
```

Notes move from right to left toward the line.

## 19.2 Beat-to-pixel calculation

```ts
x = event.startBeat * pixelsPerBeat;
```

```ts
width = event.durationBeats * pixelsPerBeat;
```

## 19.3 Timeline translation

```ts
timelineOffset = judgementLinePosition - currentBeat * pixelsPerBeat;
```

## 19.4 Pitch lanes

Each supported piano note should have a vertical lane.

Higher pitches appear above lower pitches.

## 19.5 Chord rendering

Each chord pitch should render as a separate aligned block, sharing one event ID.

```text
G4  ███
E4  ███
C4  ███
        │
   judgement line
```

## 19.6 Measure and beat grid

The timeline must show:

- beat lines
- stronger measure lines
- measure numbers
- current measure where space permits

## 19.7 Rests

Rests should be represented visually without appearing as playable notes.

## 19.8 Event states

The UI must visually distinguish:

- upcoming
- next target
- active
- perfect
- good
- accepted
- early
- late
- wrong
- missed
- completed

Feedback must not rely on colour alone.

## 19.9 Responsive scale

Suggested `pixelsPerBeat` ranges:

- phone landscape: 48–60
- tablet: 60–72
- desktop: 72–96

---

# 20. Piano Input

## 20.1 Normalized event

```ts
type PianoInputEvent = {
  note: NoteId;
  occurredAt: number;
  source: "computer-keyboard" | "touch" | "midi";
  action: "note-on" | "note-off";
  velocity?: number;
};
```

## 20.2 Initial input sources

Version 1 must support:

- computer keyboard
- on-screen piano

Web MIDI is a future extension.

## 20.3 Computer keyboard rules

- repeated keyboard events must be ignored
- typing inside inputs must not trigger notes
- held keys must not score repeatedly
- key release should produce note-off when supported

## 20.4 Touch rules

- touch must trigger sound immediately
- multi-touch should support chords
- duplicate touch events must not double-score
- disabled keys must remain accessible and clearly disabled

---

# 21. Timing Judgement

## 21.1 Classification

```ts
type TimingClassification = "perfect" | "good" | "accepted" | "early" | "late" | "wrong" | "missed";
```

## 21.2 Event result

```ts
type EventJudgement = {
  eventId: string;
  expectedNotes: NoteId[];
  playedNotes: NoteId[];
  expectedBeat: number;
  playedBeat?: number;
  deltaMs?: number;
  classification: TimingClassification;
  judgedAt: string;
};
```

## 21.3 Default timing windows

```ts
const TIMING_WINDOWS = {
  perfectMs: 80,
  goodMs: 160,
  acceptedMs: 250
};
```

These values are starting defaults and must remain configurable.

## 21.4 Delta calculation

```ts
deltaMs = actualInputTimeMs - expectedEventTimeMs;
```

Negative values mean early.

Positive values mean late.

## 21.5 Classification algorithm

```ts
if (Math.abs(deltaMs) <= perfectMs) {
  return "perfect";
}

if (Math.abs(deltaMs) <= goodMs) {
  return "good";
}

if (Math.abs(deltaMs) <= acceptedMs) {
  return "accepted";
}

if (deltaMs < 0) {
  return "early";
}

return "late";
```

An event becomes `missed` after the accepted late window expires without valid input.

## 21.6 Candidate matching

When input occurs, the engine must:

1. Find unresolved note events near the current time.
2. Filter events that contain the played pitch.
3. Select the event with the smallest absolute timing difference.
4. Prevent one input from resolving multiple events.
5. Prevent one event from being judged twice.
6. Handle repeated notes deterministically.

## 21.7 Wrong input

A note is wrong when it does not match an eligible unresolved event.

Wrong inputs must not resolve or remove the expected event.

---

# 22. Chord Judgement

## 22.1 Chord collection

After the first matching chord note:

- start a chord collection window
- collect unique note-on inputs
- compare collected pitches to the expected pitch set

Recommended initial window:

```ts
const CHORD_WINDOW_MS = 250;
```

## 22.2 Correct chord

A chord is correct when:

- every required pitch is present
- no invalid extra pitch is present
- all notes arrive within the chord window

## 22.3 Chord timing

The chord’s timing may use the average input time of all chord notes.

## 22.4 Partial chord

In performance mode:

- an incomplete chord becomes missed after the collection window

In guided mode:

- playback pauses
- missing chord notes remain highlighted

## 22.5 Arpeggiated content

An arpeggio must be represented as separate note events unless it is intentionally judged as a chord.

---

# 23. Miss Handling

## 23.1 Performance mode

When the late timing boundary passes:

```ts
classification = "missed";
```

The timeline continues.

## 23.2 Guided mode

When the late boundary passes:

1. Record a missed event.
2. Pause transport.
3. Highlight the event.
4. Wait for the correct input.
5. Record recovery separately.
6. Resume after confirmation.

---

# 24. Seeking

Seeking must be treated as a coordinated session operation.

```ts
seekTimeline(targetBeat);
```

The operation must:

1. Pause transport.
2. Clear scheduled reference audio.
3. Release active notes.
4. Move the transport.
5. Clear active chord collection.
6. Clear guided recovery.
7. Recalculate the next expected event.
8. Remove or reset judgements at and after the target beat.
9. Update the timeline visual state.
10. Remain paused until the learner presses play.

Events skipped by manual seeking must not automatically count as missed.

---

# 25. Looping

## 25.1 Loop model

```ts
type LoopRange = {
  startBeat: number;
  endBeat: number;
};
```

## 25.2 Rules

- `startBeat` must be lower than `endBeat`
- both values must remain within song bounds
- loop boundaries should snap to measures by default
- advanced users may optionally choose beat-level boundaries

## 25.3 Loop restart

At loop end:

1. Stop active notes.
2. Return to loop start.
3. Reset judgement state inside the loop.
4. Optionally play a short count-in.
5. Begin the next loop pass.

## 25.4 Loop attempts

Each loop pass should maintain separate practice statistics.

---

# 26. Timeline Session State

```ts
type TimelineSession = {
  lessonSlug: string;
  practiceMode: "guided" | "performance";
  transportState: TransportState;
  selectedBpm: number;
  tempoPercent: number;
  currentBeat: number;
  startedAt?: string;
  completedAt?: string;
  restartCount: number;
  pausedDurationMs: number;
  loopRange?: LoopRange;
  judgements: EventJudgement[];
  activeChord?: {
    eventId: string;
    collectedNotes: NoteId[];
    startedAtMs: number;
  };
  guidedRecoveryEventId?: string;
};
```

Timeline session state must remain separate from the existing guided-step session model.

---

# 27. Scoring

## 27.1 Required metrics

The system must calculate:

- correct event count
- wrong-note count
- missed-event count
- perfect count
- good count
- accepted count
- early count
- late count
- pitch accuracy
- rhythmic accuracy
- combined accuracy
- average absolute timing error
- signed average timing error
- longest streak
- selected tempo
- musical duration
- wall-clock practice duration
- restart count

## 27.2 Pitch accuracy

```ts
pitchAccuracy = correctlyResolvedEvents / totalExpectedEvents;
```

## 27.3 Timing weights

```ts
const TIMING_WEIGHT = {
  perfect: 1,
  good: 0.8,
  accepted: 0.5,
  early: 0,
  late: 0,
  missed: 0
};
```

## 27.4 Rhythmic accuracy

```ts
rhythmicAccuracy = totalWeightedTimingScore / totalExpectedEvents;
```

## 27.5 Combined accuracy

Initial formula:

```ts
combinedAccuracy = pitchAccuracy * 0.5 + rhythmicAccuracy * 0.5;
```

The weights must be configurable.

## 27.6 Tempo-aware records

Attempts at different tempos must not be compared without preserving tempo.

The application should store:

- best score at each tempo
- highest completed tempo
- best score at original tempo
- latest attempt

---

# 28. Completion

A timeline lesson is complete when:

- the transport reaches the end
- all required guided recoveries are resolved
- the final summary has been calculated
- progress has been saved or queued for saving

## 28.1 Completion summary

Display:

- lesson title
- selected BPM
- tempo percentage
- pitch accuracy
- rhythm accuracy
- combined accuracy
- perfect notes
- good notes
- misses
- wrong notes
- average timing error
- longest streak
- practice duration

## 28.2 Completion actions

Provide:

- replay
- practise slower
- practise faster
- next lesson
- return to course

---

# 29. Progress Persistence

The system must persist:

- lesson completion
- last selected tempo
- last practice mode
- metronome preference
- reference playback preference
- latest attempt
- best attempt
- highest completed tempo
- total practice time

Local persistence is acceptable for the first release.

Server-backed persistence should be added when account-based progress is available.

---

# 30. Backend Requirements

## 30.1 Course API

Existing course and lesson endpoints must return the appropriate lesson union.

Timeline responses must retain:

- mode
- schema version
- original BPM
- time signature
- count-in
- total beats
- event IDs
- event timings
- source metadata

## 30.2 Validation

All timeline data must pass Zod validation before persistence.

Mongoose validation must provide a second enforcement layer.

## 30.3 Recommended validation limits

- maximum BPM: 400
- maximum timeline events: configurable, initially 10,000
- maximum total beats: configurable
- finite numeric fields only
- supported schema versions only
- valid note IDs only
- unique event IDs
- valid event bounds

## 30.4 Unnecessary endpoint warning

Practice tempo must not be saved by changing the canonical song.

Do not add:

```text
PATCH /song/:id/tempo
```

Tempo is learner/session state.

---

# 31. Frontend Architecture

Recommended module structure:

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

## 31.1 `TimelinePlayer`

Responsibilities:

- compose the lesson screen
- coordinate transport, input, scoring, and persistence
- hold practice-mode selection
- manage lesson lifecycle

It must not contain low-level timing algorithms.

## 31.2 `timelineTransport`

Responsibilities:

- musical clock
- playback state
- tempo
- seeking
- looping
- completion

It must not depend on React.

## 31.3 `useTimelineTransport`

Responsibilities:

- expose transport state to React
- subscribe to clock changes
- provide transport commands to components

## 31.4 `useTimelineAudio`

Responsibilities:

- initialize Tone.js
- schedule reference melody
- schedule metronome
- schedule count-in
- clear active audio

## 31.5 `timingJudge`

Responsibilities:

- input matching
- timing classification
- miss detection
- repeated-note handling
- chord collection

It must be deterministic and independently testable.

## 31.6 `TimelineViewport`

Responsibilities:

- draw timeline events
- draw measure grid
- draw judgement line
- apply transport-based visual translation
- display loop regions and event states

It must not control transport state.

---

# 32. Existing Lesson Compatibility

The redesign must not break current guided lessons.

Compatibility requirements:

- lessons without `mode` are interpreted as `guided-steps` during migration
- existing `steps` arrays remain valid
- existing progress data remains readable
- existing note and chord feedback remains functional
- course unlocking continues to work
- guided completion metrics continue to work

New content must explicitly set `mode`.

---

# 33. Song Audit

Every existing song must be audited.

```ts
type SongAuditRecord = {
  courseSlug: string;
  lessonSlug: string;
  title: string;
  currentMode: "guided-steps" | "timeline";
  sourceType:
    | "midi"
    | "sheet-music"
    | "manual-transcription"
    | "recorded-performance"
    | "legacy-note-list"
    | "unknown";
  hasBpm: boolean;
  hasTimeSignature: boolean;
  hasStartBeats: boolean;
  hasDurations: boolean;
  hasRests: boolean;
  eventCount: number;
  status: "ready" | "needs-review" | "needs-transcription" | "blocked";
  issues: string[];
};
```

## 33.1 Audit classifications

### Ready

The song has complete, verified timing data.

### Needs review

The song has timing data but requires musical verification.

### Needs transcription

The song only has note order or incomplete rhythm.

### Blocked

No authoritative source is available or the content cannot legally be used.

## 33.2 Audit output

The audit command must produce:

- JSON report
- Markdown summary
- no database mutation

---

# 34. Song Migration

## 34.1 Migration sources

Preferred order:

1. MIDI
2. sheet music
3. reviewed manual transcription
4. captured performance
5. legacy note list only as pitch guidance

## 34.2 Migration requirements

Before a song becomes a production timeline lesson:

- BPM must be verified
- time signature must be verified
- every playable event must have a start beat
- every event must have a duration
- rests must be represented where musically necessary
- chords must be correctly grouped
- event IDs must be stable
- source provenance must be recorded
- the timeline must be reviewed by ear

## 34.3 Migration approach

Do not migrate all songs simultaneously.

Recommended sequence:

1. one reference song
2. one additional short song
3. five beginner songs
4. songs with MIDI
5. songs with verified notation
6. manual transcriptions
7. uncertain content last

---

# 35. Reference Song

Ode to Joy should be the initial reference song because a beat-based version already exists in the repository.

The reference implementation must validate:

- original tempo
- 50% tempo
- 70% tempo
- 100% tempo
- count-in
- metronome
- reference melody
- visual synchronization
- note judgement
- chord judgement where added
- guided mode
- performance mode
- seek
- loop
- restart
- completion
- mobile landscape

No further catalogue migration should begin until the reference implementation is stable.

---

# 36. Lesson Structure Recommendation

For song-based courses:

```text
Phrase 1
  → guided timeline

Phrase 2
  → guided timeline

Complete song
  → performance timeline
```

For foundational courses:

```text
Finger placement
  → guided steps

Note recognition
  → guided steps

Chord shapes
  → guided steps
```

This structure preserves beginner accessibility while gradually introducing rhythm.

---

# 37. Accessibility

The timeline player must support:

- keyboard operation
- visible focus
- screen-reader labels
- live announcements
- minimum 44px touch targets
- reduced motion
- high contrast
- non-colour event states
- labelled tempo controls
- accessible seek controls
- labelled transport state
- understandable completion feedback

Reduced-motion mode may simplify scrolling, but it must preserve timing information.

---

# 38. Responsive Behaviour

## 38.1 Desktop

Desktop should show:

- full timeline
- transport controls
- scoring summary
- full piano
- tempo controls
- practice-mode controls

## 38.2 Mobile landscape

Mobile landscape must prioritize:

1. timeline
2. piano
3. essential transport controls
4. tempo
5. feedback

It must avoid:

- clipped keys
- hidden controls
- page-level horizontal overflow
- unreadably small status text
- accidental browser scrolling while playing

## 38.3 Orientation changes

Changing orientation must not:

- restart the lesson
- reset the selected tempo
- corrupt transport position
- lose scoring state

---

# 39. Performance Requirements

The implementation should target:

- smooth timeline movement near 60 FPS on supported devices
- audio scheduling independent from rendering
- no full lesson rerender every frame
- indexed event lookup
- timeline virtualization for large songs
- GPU-friendly transform-based scrolling
- bounded event arrays
- deterministic input processing

The system must distinguish application scheduling performance from hardware audio latency.

---

# 40. Error Handling

## 40.1 Audio unavailable

Show:

- clear message
- retry button
- browser-permission guidance
- disabled playback controls until recovered

## 40.2 Invalid timeline data

The lesson must not begin.

Show:

- lesson unavailable
- return-to-course action
- non-technical user message

Log:

- course slug
- lesson slug
- validation errors
- schema version

## 40.3 Progress save failure

- show save failure
- retain the result locally
- allow retry
- do not erase the completion screen

## 40.4 Background tab

When the page becomes hidden:

- pause transport
- release active notes
- require explicit resume

---

# 41. Testing

## 41.1 Timeline math tests

Test:

- beat to milliseconds
- milliseconds to beat
- BPM percentage conversion
- beat to pixels
- measure calculation

## 41.2 Transport tests

Test:

- initial state
- count-in
- play
- pause
- resume
- restart
- seek
- tempo update
- completion
- loop boundaries

## 41.3 Judgement tests

Test:

- perfect input
- good input
- accepted input
- early input
- late input
- missed note
- wrong note
- repeated pitch
- nearby repeated events
- duplicate input
- event scoring once only

## 41.4 Chord tests

Test:

- complete chord
- partial chord
- wrong extra note
- duplicate note
- chord timeout
- guided chord recovery

## 41.5 Component tests

Test:

- timeline positions
- judgement line
- responsive scaling
- tempo selection
- practice-mode switching
- count-in overlay
- metronome toggle
- reference playback toggle
- seek control
- loop selection
- completion summary

## 41.6 Backend tests

Test:

- guided lesson compatibility
- valid timeline lesson
- invalid BPM
- invalid duration
- invalid note
- duplicate event ID
- unsorted events
- event beyond total beats
- unsupported schema version
- missing source metadata

## 41.7 End-to-end tests

Test:

1. Open a guided lesson.
2. Complete it normally.
3. Open a timeline lesson.
4. Start count-in.
5. Play through a song.
6. Change tempo.
7. Pause and resume.
8. Seek backward.
9. Create a loop.
10. Miss a note in guided mode.
11. Recover and continue.
12. Miss notes in performance mode.
13. Complete the lesson.
14. Refresh and restore preferences.
15. Verify mobile landscape behaviour.

---

# 42. Phased Delivery

## Phase 1 — Schema foundation

Deliver:

- lesson-mode union
- timeline schema
- source metadata
- Zod validation
- Mongoose validation
- backward compatibility

## Phase 2 — Timeline mathematics

Deliver:

- beat/time conversion
- beat/pixel conversion
- measure calculation
- deterministic tests

## Phase 3 — Transport

Deliver:

- audio-clock transport
- play
- pause
- restart
- seek
- tempo
- count-in state

## Phase 4 — Timeline UI

Deliver:

- fixed judgement line
- scrolling events
- pitch lanes
- measure grid
- note duration rendering
- rests

## Phase 5 — Audio

Deliver:

- reference melody
- note-off scheduling
- metronome
- audible count-in
- cleanup

## Phase 6 — Judgement

Deliver:

- event matching
- timing windows
- miss detection
- repeated-note handling
- chord handling

## Phase 7 — Practice modes

Deliver:

- guided timeline mode
- guided recovery
- performance mode

## Phase 8 — Practice tools

Deliver:

- looping
- safe seeking
- tempo persistence
- practice preferences

## Phase 9 — Scoring and progress

Deliver:

- full metrics
- completion summary
- local persistence
- best-tempo tracking

## Phase 10 — Catalogue migration

Deliver:

- audit report
- migration tooling
- reference song
- five reviewed songs

---

# 43. Acceptance Criteria

## 43.1 Lesson modes

- Existing guided lessons continue working.
- Timeline lessons use the timeline player.
- Invalid mixed lesson payloads are rejected.

## 43.2 Timing data

- Each timeline note has `startBeat`.
- Each timeline note has `durationBeats`.
- Each timeline has BPM and time signature.
- Tempo changes do not modify stored timing.

## 43.3 Timeline

- Notes move toward a fixed judgement line.
- Note spacing reflects beat spacing.
- Note width reflects duration.
- Chord pitches align at the same beat.
- Rests are visible but not playable.

## 43.4 Tempo

- Learners can select slower practice tempos.
- BPM is shown alongside percentage.
- Rhythm remains proportional at every tempo.
- Pitch does not change when tempo changes.

## 43.5 Transport

- Play works.
- Pause preserves position.
- Restart returns to count-in.
- Seek resets relevant state.
- Looping repeats the selected range.
- Completion occurs at the final beat.

## 43.6 Audio

- Count-in is audible.
- Metronome remains synchronized.
- Reference playback follows the timeline.
- Notes stop correctly after their duration.
- No stuck notes remain after pause, restart, seek, or route change.

## 43.7 Judgement

- Correct pitch and correct timing are judged.
- Early and late input are distinguishable.
- Missed notes are recorded.
- Wrong notes do not resolve expected events.
- Repeated pitches are matched correctly.
- Chords are judged as sets.

## 43.8 Guided timeline mode

- The timeline pauses after a miss.
- The expected note remains highlighted.
- Correct recovery allows continuation.
- Recovery input is not scored as rhythmically perfect.

## 43.9 Performance mode

- The timeline continues through mistakes.
- Later events remain scoreable.
- The lesson completes naturally.

## 43.10 Progress

- Selected tempo persists.
- Completion persists.
- Latest attempt persists.
- Highest completed tempo persists.
- Failed saves remain recoverable.

## 43.11 Content

- BPM alone is never used to fabricate rhythm.
- Every production timeline has approved source metadata.
- Ode to Joy passes complete reference validation.
- At least five songs are migrated before broad rollout.

## 43.12 UX

- Timeline instructions are readable.
- Feedback does not rely only on colour.
- Desktop is usable.
- Mobile landscape is usable.
- Orientation changes preserve lesson state.

---

# 44. Definition of Done

The original Piano360 rhythm timeline redesign is complete when:

1. Guided-step lessons remain fully functional.
2. Timeline lessons use verified beat-based data.
3. A shared musical transport controls audio and visuals.
4. Learners can change tempo without changing rhythm or pitch.
5. Notes, durations, rests, and chords render correctly.
6. Pitch and timing judgement are reliable.
7. Guided and performance timeline modes work.
8. Count-in, metronome, seeking, restart, and looping work.
9. Results and progress are persisted.
10. Existing songs have been audited.
11. Production songs have verified timing sources.
12. The reference song passes automated and manual testing.
13. The experience works on desktop and mobile landscape.
14. Core behaviour is covered by frontend, backend, and end-to-end tests.

This is the canonical specification for accomplishing the original Piano360 redesign: moving from sequential note prompts to a complete rhythm-aware, tempo-adjustable piano learning experience.
