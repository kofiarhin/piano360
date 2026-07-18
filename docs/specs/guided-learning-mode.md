# Guided Learning Mode Specification

**Status:** Approved for implementation planning  
**Project:** Piano360  
**Last updated:** 2026-07-18

## 1. Summary

Guided Learning Mode is a pause-and-wait lesson experience for Piano360. A lesson presents an ordered sequence of expected piano notes. The player advances through the sequence while the learner follows on the on-screen piano or supported keyboard controls. At each playable note, progression pauses until the learner provides the expected input.

The feature turns the existing Course -> Lesson -> Step content model into an interactive practice loop without introducing accounts, server-side learner progress, microphone pitch detection, or cloud sync.

## 2. Goals

- Provide an end-to-end guided lesson experience.
- Require correct learner input before advancing.
- Give immediate, accessible feedback for correct and incorrect input.
- Preserve progress locally using the current browser persistence approach.
- Keep lesson content compatible with the existing Course -> Lesson -> Step model.
- Provide deterministic behaviour that can be validated with unit and interaction tests.

## 3. Non-goals

- Microphone or acoustic pitch recognition.
- MIDI hardware integration unless an existing input adapter can be reused without expanding scope.
- Authentication, learner accounts, or cross-device sync.
- Teacher dashboards, multiplayer sessions, payments, or subscriptions.
- A visual course-authoring interface.
- Replacing MongoDB seed-based course publishing.

## 4. User Experience

### 4.1 Entry

A learner opens a lesson and starts Guided Learning Mode. The lesson must not start until its content has loaded and contains at least one valid playable note.

### 4.2 Countdown

Starting a lesson begins a short visual countdown. The learner may pause or cancel before the first note becomes active.

### 4.3 Guided playback

For each expected note:

1. The interface highlights the expected note and its position in the lesson.
2. Playback enters a waiting state.
3. Learner input is evaluated against the expected note.
4. Incorrect input produces feedback but does not advance.
5. Correct input produces success feedback and advances after a short configurable delay.
6. The process repeats until all playable notes are completed.

Non-playable instructional steps may display content and advance using their existing interaction pattern. They must not be treated as expected-note events unless their schema explicitly identifies playable note data.

### 4.4 Pause and resume

Pausing freezes countdowns, advancement timers, and lesson progression. Input received while paused must not count as an attempt. Resuming returns to the same expected note and state.

### 4.5 Restart and exit

Restart resets the current session metrics and returns to the beginning of the lesson. Exit returns to the lesson or course view without marking an incomplete session as completed.

### 4.6 Completion

After the final expected note is played correctly, the learner sees a completion summary containing:

- correct notes
- incorrect attempts
- retries
- completion status
- optional accuracy percentage derived from attempts

Completion updates local learner progress and may unlock the next lesson according to existing progression rules.

## 5. Supported Input

The initial implementation supports:

- on-screen piano key interactions
- existing computer-keyboard mappings, where present

All input sources must normalize into the same domain event:

```ts
type PianoInput = {
  note: string;
  source: 'onscreen' | 'keyboard' | 'midi';
  occurredAt: number;
};
```

`midi` may remain unused in the initial release. Input comparison must use normalized canonical note identifiers such as `C4`, `F#4`, or the current project equivalent.

## 6. Lesson Content Requirements

A playable lesson step must expose enough information to determine the expected note sequence. The preferred shape is:

```ts
type GuidedNote = {
  id: string;
  note: string;
  durationMs?: number;
  label?: string;
};

type GuidedStep = {
  id: string;
  type: 'guided-notes';
  notes: GuidedNote[];
};
```

The implementation may adapt this shape to existing schemas, but it must preserve these invariants:

- every playable note has a stable identifier
- note order is deterministic
- note names are valid and normalized
- empty note arrays are rejected or treated as non-playable content
- duplicate note values are allowed when they represent separate ordered events

Any API or seed changes must remain backward compatible with existing courses where practical.

## 7. State Model

The guided player uses an explicit state machine or reducer. Required states:

```ts
type GuidedLessonStatus =
  | 'loading'
  | 'ready'
  | 'countdown'
  | 'playing'
  | 'waiting_for_input'
  | 'correct_feedback'
  | 'incorrect_feedback'
  | 'paused'
  | 'completed'
  | 'error';
```

Required state data:

```ts
type GuidedLessonState = {
  status: GuidedLessonStatus;
  lessonId: string;
  notes: GuidedNote[];
  currentNoteIndex: number;
  previousStatus?: GuidedLessonStatus;
  correctNotes: number;
  incorrectAttempts: number;
  retries: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
};
```

### 7.1 Core transitions

- `loading -> ready` when valid lesson data is available.
- `loading -> error` when lesson loading or normalization fails.
- `ready -> countdown` when the learner starts.
- `countdown -> waiting_for_input` when countdown completes.
- `waiting_for_input -> incorrect_feedback` for a wrong note.
- `incorrect_feedback -> waiting_for_input` after feedback completes.
- `waiting_for_input -> correct_feedback` for the expected note.
- `correct_feedback -> waiting_for_input` when another note remains.
- `correct_feedback -> completed` after the final note.
- any active state -> `paused` on pause.
- `paused -> previousStatus` on resume, except expired feedback timers restart safely.
- any non-loading state -> `ready` on restart after state and metrics reset.

Impossible or duplicate transitions must be ignored safely rather than corrupting progression.

## 8. Note Evaluation

A normalized input is correct when its canonical note identifier equals the current expected note identifier.

For the MVP:

- enharmonic aliases may be normalized before comparison if the application already supports them
- velocity and duration do not affect correctness
- simultaneous chord evaluation is out of scope unless current lesson data already represents chords
- repeated keydown events caused by holding a computer key must be debounced or ignored until keyup
- input arriving during loading, ready, countdown, paused, feedback, completed, or error states does not count as an attempt

## 9. Feedback

### Correct input

- visually mark the expected note as correct
- optionally play the existing piano sound
- announce success through an accessible live region
- advance only once, even if duplicate events arrive

### Incorrect input

- visually identify the played note as incorrect
- keep the expected note highlighted
- announce the expected correction without exposing unnecessary internal detail
- increment incorrect attempts once per accepted input event
- return to waiting state without changing the note index

Animations must respect `prefers-reduced-motion`.

## 10. Progress Persistence

Learner progress remains browser-local under the existing `piano360.progress.v1` persistence boundary.

The implementation should extend the current progress model rather than introducing a second storage key when feasible. A completed guided lesson record should support:

```ts
type GuidedLessonProgress = {
  lessonId: string;
  completed: boolean;
  completedAt: string;
  correctNotes: number;
  incorrectAttempts: number;
  retries: number;
  bestAccuracy?: number;
};
```

Persistence requirements:

- write only after meaningful state changes, especially completion
- tolerate missing, malformed, or older stored values
- preserve unrelated existing progress fields
- do not mark a lesson complete on exit, refresh, or error
- restart increments retries only after a session has started

## 11. Client Architecture

The feature should be separated into testable layers:

- lesson-data normalization
- guided lesson reducer/state machine
- input adapter and note normalization
- timing/controller hook
- persistence adapter
- presentational components
- lesson-page integration

API requests must remain outside presentational components. Existing data-fetching conventions should be preserved. Global state is not required unless the existing application already centralizes lesson-player state; local reducer state is preferred for an isolated lesson session.

## 12. API and Data Impact

No new progress API is required.

The existing lesson endpoint may be extended only when current step payloads cannot represent ordered expected notes. Any changes must:

- retain the existing lesson route
- validate guided-note seed content
- return stable note and step identifiers
- avoid breaking non-guided lessons
- include API tests for the serialized shape

## 13. Accessibility

- All piano keys must be keyboard operable.
- Expected, correct, and incorrect states cannot rely on colour alone.
- Current progress and feedback must be available to screen readers.
- Focus must not jump on each note transition.
- Pause, resume, restart, and exit controls require clear accessible names.
- Countdown and completion announcements must not overwhelm assistive technology.
- Touch targets should meet practical mobile sizing expectations.

## 14. Responsive Behaviour

- The player remains usable on small mobile screens without horizontal page overflow.
- The expected note, progress, and primary controls remain visible or immediately accessible.
- Piano keys may scroll within a dedicated region when the full keyboard cannot fit.
- Desktop layouts may show richer progress context but must not change lesson semantics.

## 15. Error Handling

The player enters `error` when:

- lesson content cannot be loaded
- playable note content is invalid
- the lesson has no playable notes and cannot fall back to an instructional view
- an unrecoverable normalization or persistence error prevents safe progression

Recoverable local-storage failures should not block lesson play. They should surface a non-destructive warning and allow completion without persistence.

The error UI must provide a retry or return action.

## 16. Analytics Boundaries

No external analytics integration is required. Internal session metrics are limited to the values needed for learner feedback and local progress.

## 17. Performance

- Note evaluation should be synchronous and effectively constant time.
- Rendering should avoid rebuilding the full lesson sequence on every key event.
- Timers must be cleaned up on pause, restart, exit, unmount, and lesson change.
- Duplicate input events must not cause duplicate transitions or persistence writes.

## 18. Security and Privacy

- No microphone permissions are requested.
- No personal learner data is introduced.
- Stored progress remains local and should not contain secrets or sensitive information.
- Lesson content must continue to be validated at the API/data boundary.

## 19. Testing Requirements

### Unit tests

- note normalization and comparison
- lesson-data normalization and validation
- every valid reducer transition
- ignored invalid transitions
- repeated-note sequences
- retry and metric calculations
- progress migration and malformed-storage handling

### Component and interaction tests

- start and countdown
- correct input advances exactly once
- incorrect input does not advance
- pause blocks input and resume restores the expected note
- restart resets position and metrics correctly
- completion persists progress
- keyboard and on-screen inputs produce equivalent outcomes
- accessible labels and announcements

### API tests

Only required if the lesson response or seed schema changes:

- guided note content serializes correctly
- invalid seeded note data is rejected
- existing non-guided lesson responses remain valid

### Manual validation

- mobile and desktop layouts
- keyboard-only use
- screen-reader announcements
- reduced-motion behaviour
- refresh, exit, and storage-failure scenarios

## 20. Acceptance Criteria

1. A learner can start a guided lesson from a valid lesson page.
2. The lesson clearly identifies the expected note.
3. Playback waits until the expected note is played.
4. A wrong note produces feedback and never advances the sequence.
5. A correct note advances exactly once.
6. Pause prevents learner input from affecting progress.
7. Resume returns to the same expected note.
8. Restart returns to the first note and resets session metrics.
9. Completing the final note shows a summary and records local completion.
10. Refreshing or exiting early does not mark the lesson complete.
11. On-screen and supported keyboard input follow the same evaluation path.
12. The experience is keyboard accessible, responsive, and reduced-motion aware.
13. Existing courses and non-guided lesson behaviour continue to work.
14. Relevant lint, typecheck, unit, interaction, API, and build checks pass.

## 21. Risks and Edge Cases

- Current seeded step data may not contain stable ordered note identifiers.
- Existing piano input may emit repeated keydown events.
- Feedback timers can race with pause, restart, navigation, or unmount.
- Older local progress data may require defensive migration.
- Small screens may make a full piano keyboard difficult to operate.
- Consecutive identical notes require event-based progression rather than value-based deduplication.
- Browser audio restrictions may prevent sound before user interaction; visual feedback must remain sufficient.

## 22. Release Boundary

The feature is ready for release when the acceptance criteria pass, guided lesson content exists for at least one seeded lesson, and the existing course experience has no regressions. Broader course conversion can happen incrementally after the first validated guided lesson.