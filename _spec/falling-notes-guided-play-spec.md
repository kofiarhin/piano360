# Piano360 Falling Notes Guided Play Specification

**Status:** Approved implementation specification  
**Repository:** `kofiarhin/piano360`  
**Version:** 1.0  
**Primary surface:** `apps/client/src/features/courses/LessonPlayer.tsx`  
**Supersedes for Guided Play behavior:** Any earlier requirement that Guided Play pauses automatically when a note is missed.

---

## 1. Objective

Replace the current learner-facing step-by-step Guided Play interaction with a continuous falling-notes rhythm experience.

Every playable lesson must show notes moving vertically toward a strike line positioned directly above the matching piano keys. The learner must press the correct computer-keyboard key or on-screen piano key when the falling note reaches the strike line.

The implementation must preserve the existing course, lesson, unlock, progress, audio, routing, and piano systems while replacing the learner-facing guided interaction and consolidating all playable lessons onto one timeline-driven engine.

---

## 2. Current Codebase Findings

### 2.1 Routing and lesson selection

`apps/client/src/App.tsx` routes all lessons through:

```text
/courses/:courseSlug/lessons/:lessonSlug
```

`LessonPlayer.tsx` currently branches between:

- `PlayerLoaded` for legacy guided-step lessons
- `TimelinePlayer` for authored timeline lessons

The target implementation must remove this learner-facing split. Both lesson shapes must resolve to the same falling-notes player.

### 2.2 Current guided-step behavior

`PlayerLoaded` currently:

- displays one target step at a time
- highlights target keys
- advances only after correct input
- uses `lessonEngine.ts`
- applies a chord input timeout
- records correct/incorrect input counts

This behavior is incompatible with continuous rhythm gameplay and must not remain the normal Guided Play route.

### 2.3 Existing timeline infrastructure

The repository already contains:

- `TimelinePlayer.tsx`
- `TimelineViewport.tsx`
- `useTimelineTransport.ts`
- `timelineTransport.ts`
- `timelineMath.ts`
- `timingJudge.ts`
- `TempoControl.tsx`
- `TransportControls.tsx`
- `useTimelineInput.ts`
- tempo persistence
- authored `SongTimeline` support

These components provide a useful base, but the current viewport is horizontal and lane-based. The new experience requires a vertical piano-roll renderer aligned directly with the existing piano keys.

### 2.4 Current timing judge

The current timing judge already uses the approved real-time windows:

- perfect: 80 ms
- good: 160 ms
- accepted: 250 ms

Required changes:

- rename `accepted` to directional `early` or `late`
- use point values 100 / 70 / 40
- support `partial`
- score chords using the least accurate required note
- expire incomplete chords as `partial`
- maintain wrong-note feedback without consuming an event
- add combo state

### 2.5 Existing piano and input

The current lesson player uses:

- `CoursePiano`
- `courseKeyboard.ts`
- `NotePlayer`
- direct on-screen input callbacks
- direct window keyboard listeners

Both input methods must be routed through one timestamped note-attempt interface.

---

## 3. Product Behavior

### 3.1 Continuous rhythm mode

Guided Play must use continuous rhythm mode by default.

- Notes fall continuously.
- The transport does not pause on a miss.
- Missed notes continue beyond the strike line and leave the active render window.
- The learner receives immediate timing feedback.
- The lesson completes when the timeline ends and all due events have been finalized.

A future wait mode may pause for beginners, but it is outside this implementation.

### 3.2 Falling note presentation

The player must contain, from top to bottom:

1. lesson navigation and title
2. score, combo, timing feedback, progress, and tempo controls
3. falling-note stage
4. strike line
5. piano keyboard

Each falling note must:

- occupy the horizontal lane of its matching piano key
- move vertically toward the strike line
- reach the strike line at its target timestamp
- use height to represent duration
- remain visually connected to the key lane

Chord notes sharing one event must fall together and reach the strike line simultaneously.

### 3.3 Strike line

The strike line must:

- sit immediately above the piano keyboard
- span the playable piano width
- remain fixed while notes move
- be visually distinct
- align with the exact moment used by the timing judge

The bottom edge of a note bar is the note-on target point. Its duration extends upward from that point.

### 3.4 Count-in

Before every fresh start or restart:

- use the lesson timeline's `countInBeats` when authored
- use 4 beats for generated timelines
- show an audible/visual count-in
- render upcoming notes during count-in
- ignore scoring input during count-in
- allow piano audio preview only if explicitly retained as a non-scoring product choice; otherwise ignore note input entirely

Resume after pause does not replay count-in.

---

## 4. Timeline Resolution

### 4.1 One normalized player input

The falling-notes player must accept one normalized structure regardless of lesson source:

```ts
export type ResolvedGuidedTimeline = {
  lessonId: string;
  source: "authored" | "generated";
  originalBpm: number;
  timeSignature: TimeSignature;
  countInBeats: number;
  totalBeats: number;
  events: TimedNoteEvent[];
};
```

Rest events may remain in the canonical song model, but the falling renderer only needs note events and beat-grid metadata.

### 4.2 Authored timeline lessons

When `lesson.timeline` exists:

- preserve `startBeat`
- preserve `durationBeats`
- preserve chords as one event with multiple notes
- preserve `originalBpm`
- preserve `countInBeats`
- preserve `totalBeats`
- preserve ordering and stable event IDs

No generated spacing may override authored timing.

### 4.3 Generated timelines for step lessons

Legacy step lessons must be converted before rendering.

Defaults:

```ts
const GENERATED_TIMELINE_DEFAULTS = {
  originalBpm: 60,
  countInBeats: 4,
  eventSpacingBeats: 2,
  durationBeats: 1,
  timeSignature: { numerator: 4, denominator: 4 }
};
```

Conversion rules:

- step index 0 starts at beat 0
- every following step starts 2 beats after the previous step
- every generated event lasts 1 beat
- a chord step creates one event containing all target notes
- generated event IDs derive from stable step IDs
- `totalBeats` equals the final event end beat plus one trailing beat
- duplicate notes inside a chord must be rejected during normalization
- an empty step list must produce a controlled invalid-lesson state

Example:

```ts
steps.map((step, index) => ({
  id: `generated-${step.id}`,
  type: "note",
  notes: step.targetNotes,
  startBeat: index * 2,
  durationBeats: 1,
  hand: lesson.courseHand
}));
```

### 4.4 Resolver location

Add a pure resolver module:

```text
apps/client/src/features/courses/timeline/resolveGuidedTimeline.ts
```

It must contain no React, DOM, audio, or storage dependencies.

---

## 5. Playback Clock

### 5.1 Authoritative clock

One monotonic clock must drive:

- current musical beat
- note positions
- count-in
- timing judgement
- miss expiration
- progress
- completion
- metronome scheduling if enabled

Use `performance.now()` or an audio-context-derived monotonic clock. Do not use `Date.now()` for judgement.

React render frequency must not determine scoring accuracy.

### 5.2 Pause

Pause must freeze:

- current beat
- falling notes
- count-in
- progress
- miss detection
- pending chord expiration
- scheduled reference playback

Input during pause must not be judged.

### 5.3 Resume

Resume must:

- continue at the exact paused beat
- preserve score and judged events
- preserve unresolved future events
- not replay count-in
- rebase the monotonic clock without changing musical position

### 5.4 Restart

Restart must:

- return to the beginning of count-in
- reset score
- reset combo
- reset feedback
- clear judged event IDs
- clear pending chord state
- clear missed and partial states
- increment existing restart metrics if retained
- not duplicate stored completion records

### 5.5 Tempo changes

Tempo behavior:

- while playing: automatically pause, then apply tempo
- while paused: apply immediately
- preserve current musical beat
- recompute future target timestamps from that beat
- keep past results unchanged
- require the learner to resume manually

Timing windows remain fixed in real milliseconds at every tempo.

### 5.6 Seeking

The current timeline player exposes seeking. For this implementation:

- seeking should be removed from the primary Guided Play UI unless intentionally retained for debugging or advanced practice
- if retained, seeking backward must reset results at or after the target beat
- seeking forward must finalize skipped unresolved events as missed

The safer first-release behavior is no learner-facing seek control.

---

## 6. Input Architecture

### 6.1 Shared note-attempt interface

Add a single input contract:

```ts
export type NoteInputSource = "computer-keyboard" | "on-screen-piano" | "midi";

export type NoteAttempt = {
  note: NoteId;
  source: NoteInputSource;
  timestampMs: number;
};
```

Both supported input sources must call the same handler:

```ts
onNoteAttempt({
  note,
  source,
  timestampMs: performance.now()
});
```

Web MIDI is not implemented, but the contract must already permit it.

### 6.2 Computer keyboard

Requirements:

- reuse the existing `keyboardMap`
- ignore repeated keydown events
- ignore events originating in editable controls
- prevent default only for mapped piano keys and player shortcuts
- timestamp input at the event boundary before React state updates

### 6.3 On-screen piano

Requirements:

- `CoursePiano` must emit note attempts through the same normalized path
- pointer/touch input must be timestamped immediately
- audio and judgement must receive the same note identity
- disabled/count-in/paused state must be enforced before judgement

### 6.4 Wrong note behavior

A wrong note:

- plays piano audio when audio is available
- shows immediate wrong-note feedback
- does not consume any expected event
- does not reduce score
- does not change combo
- does not mark a chord partial by itself

---

## 7. Timing and Event Matching

### 7.1 Timing windows

```ts
export const TIMING_WINDOWS_MS = {
  perfect: 80,
  good: 160,
  accepted: 250
} as const;
```

Classification:

- `perfect`: absolute delta <= 80 ms
- `good`: absolute delta <= 160 ms
- `early`: delta < -160 ms and absolute delta <= 250 ms
- `late`: delta > 160 ms and absolute delta <= 250 ms
- `missed`: no correct completion by target + 250 ms
- `partial`: at least one required chord note was collected, but the full chord was not completed by target + 250 ms
- `wrong`: input matched no required note for the selected candidate event

Boundary values are inclusive.

### 7.2 Candidate event selection

For an input note:

1. consider unresolved note events whose target time is within ±250 ms
2. prefer events containing the played note
3. choose the smallest absolute timing delta
4. break ties by earlier `startBeat`
5. never match an already finalized event

This avoids a nearby wrong-pitch event blocking a valid event containing the played note.

### 7.3 Single-note result

A correct single-note input immediately finalizes the event.

```ts
type EventResult = {
  eventId: string;
  classification: "perfect" | "good" | "early" | "late" | "partial" | "missed";
  deltaMs: number;
  playedNotes: NoteId[];
  points: number;
};
```

### 7.4 Chord collection

A chord is one event with multiple required notes.

- collection begins when the first correct required note is played within ±250 ms
- required notes may arrive in any order
- duplicate presses do not count twice
- all notes must be collected before target + 250 ms
- notes may be collected across the full event window
- unrelated notes do not invalidate the chord

### 7.5 Complete chord classification

A completed chord uses the least accurate required note.

Example deltas:

```text
C4: 25 ms
E4: 70 ms
G4: 142 ms
```

Chord result: `good`, because 142 ms is the least accurate note.

The event's displayed delta should be the signed delta of the least accurate note. If equal absolute deltas exist, prefer the later collected note for deterministic output.

### 7.6 Partial chord

When the chord deadline passes:

- if zero required notes were collected: `missed`
- if one or more but not all required notes were collected: `partial`

Partial chord points: 20.

### 7.7 Simultaneous events

If separate events share the same target beat:

- they remain separate scoreable events
- one input may satisfy only one event
- candidate selection must remain deterministic
- authored chords should normally be represented as one multi-note event rather than separate simultaneous single-note events

---

## 8. Scoring and Combo

### 8.1 Points

```ts
export const SCORE_VALUES = {
  perfect: 100,
  good: 70,
  early: 40,
  late: 40,
  partial: 20,
  missed: 0
} as const;
```

Wrong notes contribute zero points and do not lower the existing score.

### 8.2 Combo

Combo rules:

- Perfect: increment by 1
- Good: increment by 1
- Early: reset to 0
- Late: reset to 0
- Partial: reset to 0
- Missed: reset to 0
- Wrong: unchanged

Track both current combo and maximum combo.

### 8.3 Summary metrics

Completion summary must include:

```ts
type GuidedPlaySummary = {
  score: number;
  maxPossibleScore: number;
  scorePercent: number;
  maxCombo: number;
  perfectInputs: number;
  goodInputs: number;
  earlyInputs: number;
  lateInputs: number;
  partialInputs: number;
  missedInputs: number;
  wrongInputs: number;
  meanAbsoluteTimingErrorMs: number;
  durationMs: number;
  restartCount: number;
};
```

`maxPossibleScore` equals note-event count × 100.

Wrong notes may be tracked for learner feedback, but they do not enter score percentage.

---

## 9. Falling-Note Renderer

### 9.1 New component

Replace the horizontal `TimelineViewport` in Guided Play with:

```text
apps/client/src/features/courses/timeline/FallingNotesStage.tsx
```

Suggested supporting files:

```text
fallingNotesLayout.ts
fallingNotesTypes.ts
usePianoKeyGeometry.ts
```

### 9.2 Piano-key alignment

The renderer must derive lane geometry from the actual rendered `CoursePiano` keyboard.

Preferred approach:

- expose stable `data-note-id` attributes on piano keys
- measure each key's bounding box relative to the piano container
- use `ResizeObserver` to recompute geometry
- pass geometry to the falling-note stage
- align each note bar to the center/width of its corresponding key

Do not hard-code equal-width semitone lanes because white and black piano keys have different widths and positions.

### 9.3 White and black key lanes

- white-key note bars use the measured white-key width
- black-key note bars use the measured black-key width
- black-key notes render above white-key lanes in stacking order
- chord bars must remain visually separable
- bars must not obscure strike feedback on the key itself

### 9.4 Travel calculation

Define:

```ts
const msUntilTarget = targetTimestampMs - currentTimestampMs;
const pixelsPerMs = travelDistancePx / lookAheadMs;
const bottomPx = strikeLineY + msUntilTarget * pixelsPerMs;
```

Equivalent beat-based math is acceptable if it derives from the same authoritative clock.

Required properties:

- the note reaches strike line exactly at target time
- speed scales with selected BPM
- timing judgement does not derive from rendered position
- animation uses `transform: translate3d(...)`
- no React state update is required per individual note

### 9.5 Look-ahead window

Recommended default:

```ts
const LOOK_AHEAD_BEATS = 4;
const TRAILING_BEATS = 1;
```

Only render events inside the visible time window plus a small buffer.

This must support long lessons without rendering every note into the DOM.

### 9.6 Long notes

Visual height is based on duration:

```ts
heightPx = durationBeats * pixelsPerBeat;
```

First release behavior:

- only note-on timing is scored
- releasing early does not reduce score
- no sustain requirement
- completed long notes may visually fade after their target crosses the strike line

### 9.7 Result visuals

Suggested states:

- upcoming: neutral
- current target: emphasized outline/glow
- perfect: success flash
- good: softer success flash
- early/late: warning flash
- partial: chord bars show collected vs missing notes
- missed: error fade

Animations must respect `prefers-reduced-motion`.

---

## 10. Player State Architecture

Use a reducer or pure state machine rather than distributing scoring state across unrelated React state hooks.

```ts
type GuidedPlayState = {
  phase: "idle" | "count-in" | "playing" | "paused" | "completed";
  score: number;
  combo: number;
  maxCombo: number;
  resultsByEventId: Record<string, EventResult>;
  pendingChord?: PendingChordAttempt;
  feedback?: TimingFeedback;
  wrongInputCount: number;
  restartCount: number;
};
```

Suggested modules:

```text
guidedPlayReducer.ts
guidedPlaySelectors.ts
guidedPlayScoring.ts
```

The reducer must be deterministic and testable without React.

---

## 11. UI Requirements

### 11.1 Transport

Required controls:

- Play / Resume
- Pause
- Restart
- Tempo selector

Tempo control is disabled or triggers auto-pause while actively playing.

### 11.2 Status HUD

Always show:

- score
- combo
- progress
- current timing feedback
- BPM or tempo percentage

Feedback examples:

```text
Perfect +42 ms
Good -118 ms
Early -204 ms
Late +231 ms
Partial chord
Missed
Wrong note
```

### 11.3 Completion

When playback reaches the end and all events are finalized:

- stop animation
- show the completion summary
- persist lesson completion once
- expose Replay
- expose Continue
- expose Return to course
- preserve existing unlock progression

### 11.4 Responsive behavior

Desktop:

- full falling stage and piano visible together
- no horizontal page scroll

Tablet/mobile landscape:

- retain `MobileLandscapeShell`
- compact navigation and HUD
- piano remains playable
- stage height adapts to remaining viewport

Mobile portrait:

- show the existing landscape recommendation or a controlled compact mode
- do not allow key lanes and note bars to become misaligned

---

## 12. Audio

- continue using `NotePlayer`
- warm audio on the first qualifying user gesture
- input audio must play independently from score state
- audio initialization must not accidentally consume the first scored note
- unavailable audio must not crash visual practice
- reference playback is not required for this implementation unless already stable
- metronome may remain if already supported, but it must use the same transport clock

---

## 13. Progress Persistence

Preserve the existing local progress key and course unlock flow.

Extend completion payloads without breaking older records.

Recommended compatibility strategy:

- retain existing base fields such as `accuracy`, `durationMs`, and `restartCount`
- add optional rhythm-game fields
- derive legacy `accuracy` from completed non-wrong events divided by total events
- do not count wrong notes as missed events
- tolerate stored records without new fields

Do not introduce server-side learner persistence in this scope.

---

## 14. Backend and Content Model

### 14.1 API compatibility

The API may continue returning both lesson shapes during migration:

- guided-step lessons with `steps`
- timeline lessons with `timeline`

The client resolver must normalize both.

### 14.2 Validation

Existing timeline validation must continue enforcing:

- unique event IDs
- ordered start beats
- positive durations
- events ending within `totalBeats`
- unique notes within one chord
- supported note IDs

Generated timelines should be validated with the same client-side schema or invariant checks before playback.

### 14.3 No mandatory seed migration

The first implementation does not require converting all database lesson records to authored timeline lessons.

Generated step timelines provide immediate coverage for existing lessons. Authored timelines can be added later for musical accuracy.

---

## 15. File-Level Implementation Map

### Modify

```text
apps/client/src/features/courses/LessonPlayer.tsx
```

- remove learner-facing branch to `PlayerLoaded`
- resolve every lesson to a guided timeline
- render one falling-notes player
- preserve loading, error, lock, and route behavior

```text
apps/client/src/features/courses/timeline/TimelinePlayer.tsx
```

- convert to continuous-only Guided Play behavior
- remove guided pause-on-miss recovery
- remove or defer practice-mode toggle
- integrate score/combo reducer
- integrate falling stage
- persist updated summary

```text
apps/client/src/features/courses/timeline/timingJudge.ts
```

- add early/late/partial classifications
- implement note-aware candidate selection
- use least-accurate chord note
- expire pending chords as partial
- preserve wrong-note non-consumption

```text
apps/client/src/features/courses/timeline/useTimelineTransport.ts
apps/client/src/features/courses/timeline/timelineTransport.ts
```

- guarantee exact pause/resume semantics
- preserve beat on BPM changes
- expose monotonic target-time conversion as needed
- make tests injectable with a fake clock

```text
apps/client/src/features/courses/CoursePiano.tsx
```

- expose note key geometry hooks/data attributes
- emit normalized input or retain callback with source wrapping at parent
- preserve current visual feedback props

```text
apps/client/src/features/courses/progressStorage.ts
apps/client/src/features/courses/courseTypes.ts
```

- add optional score/combo/result metrics
- preserve backward compatibility

### Add

```text
apps/client/src/features/courses/timeline/resolveGuidedTimeline.ts
apps/client/src/features/courses/timeline/FallingNotesStage.tsx
apps/client/src/features/courses/timeline/fallingNotesLayout.ts
apps/client/src/features/courses/timeline/guidedPlayReducer.ts
apps/client/src/features/courses/timeline/guidedPlayScoring.ts
apps/client/src/features/courses/timeline/noteInput.ts
apps/client/src/features/courses/timeline/usePianoKeyGeometry.ts
```

### Retire from learner routing

```text
PlayerLoaded in LessonPlayer.tsx
lessonEngine.ts for Guided Play progression
TimelineViewport.tsx horizontal presentation
```

The old modules may remain temporarily until tests and migration are complete, but must not be used by normal lesson routes.

---

## 16. Testing Strategy

Use Vitest and React Testing Library for client tests.

### 16.1 Resolver unit tests

- generated single-note timeline
- generated chord timeline
- exact two-beat spacing
- one-beat duration
- four-beat count-in
- 60 BPM default
- stable generated IDs
- total-beat calculation
- authored timeline preservation
- empty lesson failure

### 16.2 Judge unit tests

Test exact boundaries:

- -250, -160, -80, 0, +80, +160, +250 ms
- +251 ms miss expiration
- correct classification direction
- wrong note does not consume event
- closest valid matching event selection
- repeated pitch events remain independent
- duplicate chord input ignored
- full chord in any order
- full chord uses least accurate note
- incomplete chord becomes partial
- untouched chord becomes missed
- simultaneous event determinism

### 16.3 Scoring reducer tests

- points for every classification
- wrong note leaves score unchanged
- combo increments only on Perfect/Good
- combo reset rules
- max combo tracking
- restart reset
- summary totals

### 16.4 Transport unit tests

Use a fake monotonic clock.

- count-in starts at -4 beats
- pause freezes beat
- resume continues exactly
- restart returns to count-in
- BPM change preserves beat
- BPM change while playing pauses
- completion at total beats
- no miss expiration while paused

### 16.5 Renderer tests

- notes align to supplied key geometry
- chord bars share target Y
- duration changes bar height
- strike-line crossing matches target timestamp
- visible-window filtering
- resize geometry update
- reduced-motion behavior

### 16.6 Integration tests

- legacy step lesson renders falling notes
- authored timeline lesson renders falling notes
- keyboard and on-screen input produce identical results
- input ignored during count-in
- input ignored while paused
- miss does not pause playback
- tempo change auto-pauses
- restart clears gameplay state
- completion persists once
- next lesson unlock remains functional

### 16.7 Regression tests

- course and lesson loading
- locked lesson screen
- audio unavailable state
- course progress reset
- mobile landscape shell
- existing freestyle mode unaffected

---

## 17. Performance Requirements

- use one `requestAnimationFrame` loop for the stage
- avoid one interval per note
- avoid React state updates for every note position
- use CSS transforms for movement
- render only the visible note window plus buffer
- cache normalized timelines with `useMemo`
- recompute key geometry only on layout change
- target smooth animation at 60 FPS on current desktop and modern mobile browsers
- timing judgement must remain accurate during dropped visual frames

---

## 18. Accessibility

- transport controls require accessible names
- keyboard focus must remain visible
- status feedback must use a non-disruptive `aria-live="polite"` region
- do not announce every animation frame
- color must not be the only result indicator
- provide text labels for timing classifications
- respect reduced motion
- ensure touch targets meet minimum practical size
- maintain usable computer-keyboard controls without requiring pointer input

---

## 19. Risks and Mitigations

### Key geometry drift

Risk: falling bars do not line up with responsive piano keys.

Mitigation: measure actual key DOM geometry with `ResizeObserver`; never duplicate keyboard layout math independently.

### Audio initialization latency

Risk: first note is visually judged but audio starts late.

Mitigation: warm audio from transport Play interaction and keep scoring tied to input timestamp, not audible output.

### React render latency

Risk: state updates distort judgement.

Mitigation: timestamp at input boundary and judge using monotonic clock data before UI rendering.

### Dense chord input

Risk: browser key ghosting prevents some physical keyboard chord combinations.

Mitigation: support on-screen input, document practical keyboard limitations, and keep future MIDI input abstraction.

### Existing canonical spec conflict

Risk: older spec requires pause-on-miss guided recovery.

Mitigation: this specification explicitly supersedes that behavior for the falling-notes Guided Play implementation.

---

## 20. Acceptance Criteria

The implementation is accepted when all statements below are true.

1. Every unlocked playable lesson route renders the falling-notes player.
2. Legacy step lessons are converted to timelines with 2-beat spacing, 1-beat duration, 4-beat count-in, and 60 BPM.
3. Authored timelines retain their exact rhythm and duration data.
4. Notes fall vertically and align with the correct on-screen piano keys.
5. Chords fall simultaneously and require all notes within the timing window.
6. Long notes render with proportional height while only note-on is scored.
7. Perfect, Good, Early, Late, Partial, Missed, and Wrong feedback behaves as specified.
8. Scores use 100, 70, 40, 40, 20, and 0 points respectively.
9. Wrong notes do not consume expected events or lower score.
10. Combo changes exactly according to the approved rules.
11. Missed notes do not pause playback.
12. Pause freezes the timeline and judgement clock.
13. Resume continues without count-in.
14. Restart resets gameplay and replays the full count-in.
15. Tempo changes while playing automatically pause and preserve beat position.
16. Computer-keyboard and on-screen piano input share one judgement path.
17. Input is ignored during count-in and pause.
18. Completion saves once and preserves existing course unlock behavior.
19. Timing tests cover all boundary values and chord edge cases.
20. The falling renderer remains synchronized even when visual frames are delayed.

---

## 21. Out of Scope

- Web MIDI implementation
- hold-duration scoring
- sustain pedal scoring
- beginner wait mode
- pause-on-miss recovery
- multiplayer
- leaderboards
- server-side score storage
- lesson authoring UI
- automatic transcription
- dynamic difficulty
- advanced particle effects

---

## 22. Definition of Done

- implementation matches all acceptance criteria
- all new pure modules have unit tests
- existing client test suite passes
- typecheck passes
- lint passes
- production build passes
- legacy and authored lesson integration tests pass
- no normal learner route renders the old step-by-step player
- the new spec is referenced in the implementation pull request
