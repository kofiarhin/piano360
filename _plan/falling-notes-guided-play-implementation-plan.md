# Falling Notes Guided Play Implementation Plan

Source spec: [`_spec/falling-notes-guided-play-spec.md`](../_spec/falling-notes-guided-play-spec.md)

## 1. Implementation Goal

Replace the learner-facing guided-step lesson experience with one continuous falling-notes Guided Play engine. All playable lesson routes should normalize lesson content into a single timeline model, render vertical falling notes aligned to the existing `CoursePiano`, judge timestamped note attempts through one input path, and preserve existing course loading, unlock, audio, routing, and local progress behavior.

This plan is intentionally phased so the work can land in reviewable increments without mixing resolver, transport, scoring, renderer, and persistence risk into one large change.

## 2. Current Repo Baseline

Relevant current files:

- `apps/client/src/features/courses/LessonPlayer.tsx`
  - Already routes unlocked playable lessons to `TimelinePlayer` through `resolveLessonToTimeline`.
  - Still contains `PlayerLoaded` and `lessonEngine` guided-step implementation for a dev-only `?legacyPlayer=1` path.
  - Preserves loading, locked, not-found, migration-blocked, route, and progress-save behavior.

- `apps/client/src/features/courses/timeline/resolveLessonToTimeline.ts`
  - Converts only foundational course legacy steps via `legacyStepsToInstructionalTimeline`.
  - Blocks non-foundational legacy song lessons behind migration state.
  - Uses `source: "native" | "legacy-instructional-adapter"` instead of the spec's `source: "authored" | "generated"`.

- `apps/client/src/features/courses/timeline/TimelinePlayer.tsx`
  - Uses horizontal `TimelineViewport`.
  - Contains scoring summary logic inline.
  - Still supports practice mode switching and guided pause-on-miss recovery when `lesson.behaviour.pauseOnMiss` is true.
  - Uses `useTimelineInput` for keyboard input and `CoursePiano` for on-screen input, but both pass only `NoteId`, not timestamped `NoteAttempt`.

- `apps/client/src/features/courses/timeline/timingJudge.ts`
  - Supports `perfect`, `good`, `accepted`, `missed`, and `wrong`.
  - Uses average timestamp for chord classification.
  - Chooses closest candidate by absolute delta without prioritizing events containing the played note.
  - Does not support directional `early` / `late`, `partial`, score values, combo, or point-bearing results.

- `apps/client/src/features/courses/timeline/timelineTransport.ts`
  - Uses a monotonic `performance.now()` clock by default and supports fake `now` injection.
  - Starts at negative count-in beat and has pause, resume, restart, seek, and BPM changes.
  - Needs stricter semantics around restart clock rebase, completion, count-in input ignoring, no learner-facing seek, and BPM-change auto-pause.

- `apps/client/src/features/courses/CoursePiano.tsx`
  - Already renders stable `data-note-id` and `data-tone` attributes on key buttons.
  - Exposes one `onInput(noteId)` callback but does not pass source or timestamp.
  - Has scroll and fit-to-container behavior that must be included in geometry measurement.

- `apps/client/src/features/courses/progressStorage.ts`
  - Stores `LessonMetrics` from `lessonEngine` plus course/lesson fields.
  - Completion records already include a `completionCount` increment.
  - Needs optional rhythm-game metrics while preserving `piano360.progress.v1` compatibility unless a deliberate schema migration is introduced.

## 3. Guiding Constraints

- Do not introduce server-side learner persistence.
- Do not migrate seed data as a prerequisite.
- Do not hard-code piano key lanes independently of the rendered keyboard.
- Do not derive scoring from React render cadence or animated note positions.
- Keep `Date.now()` out of judgement logic.
- Keep wrong notes non-consuming and score-neutral.
- Preserve local unlock progression and route behavior.
- Preserve existing audio failure behavior: unavailable audio must not crash visual practice.
- Keep Web MIDI out of scope, but include `"midi"` in the input contract.
- Remove learner-facing seek and guided pause-on-miss behavior for the new Guided Play path.

## 4. Target Architecture

### 4.1 Normalized Timeline

Add:

- `apps/client/src/features/courses/timeline/resolveGuidedTimeline.ts`

Export:

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

Responsibilities:

- Accept `LessonDetail`.
- Preserve authored `lesson.timeline` note events exactly.
- Convert legacy `steps` into generated timed note events.
- Reject generated chord steps with duplicate notes.
- Return a controlled invalid state for empty step lists or invalid lesson data.
- Stay pure: no React, DOM, audio, storage, or router imports.

Recommended return shape:

```ts
type ResolveGuidedTimelineResult =
  | { status: "playable"; timeline: ResolvedGuidedTimeline }
  | { status: "invalid"; reason: string };
```

Keep or wrap `resolveLessonToTimeline.ts` temporarily if existing tests depend on it, but the new player path should use `resolveGuidedTimeline`.

### 4.2 Input Contract

Add:

- `apps/client/src/features/courses/timeline/noteInput.ts`

Export:

```ts
export type NoteInputSource = "computer-keyboard" | "on-screen-piano" | "midi";

export type NoteAttempt = {
  note: NoteId;
  source: NoteInputSource;
  timestampMs: number;
};
```

All keyboard and on-screen input should call one player handler with `timestampMs: performance.now()` captured at the event boundary before state updates.

### 4.3 Gameplay State

Add:

- `apps/client/src/features/courses/timeline/guidedPlayReducer.ts`
- `apps/client/src/features/courses/timeline/guidedPlayScoring.ts`
- `apps/client/src/features/courses/timeline/guidedPlaySelectors.ts` if selectors become non-trivial.

Keep scoring deterministic and testable outside React. Suggested state:

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

Reducer responsibilities:

- Reset on restart.
- Preserve score and results across pause/resume.
- Apply event results to score/combo.
- Track wrong input count without consuming events.
- Produce completion summary.

### 4.4 Timing Judge

Modify:

- `apps/client/src/features/courses/timeline/timingJudge.ts`

Target classifications:

- `perfect`
- `good`
- `early`
- `late`
- `partial`
- `missed`
- `wrong`

Key changes:

- Preserve current windows: `80`, `160`, `250` ms.
- Split `accepted` into directional `early` and `late`.
- Candidate selection must first consider unresolved events within `+/-250ms`, prefer events containing the played note, then smallest absolute delta, then earlier `startBeat`.
- Single-note correct input finalizes immediately.
- Chord collection starts on the first correct required note within the window.
- Chords complete in any note order.
- Duplicate chord input does not count twice.
- Complete chord classification uses the least accurate required note, not average timestamp.
- Incomplete chord at target `+250ms` becomes `partial` if any required notes were collected.
- Untouched event at target `+250ms` becomes `missed`.
- Wrong notes return feedback but do not consume or alter expected events.

### 4.5 Transport

Modify:

- `apps/client/src/features/courses/timeline/timelineTransport.ts`
- `apps/client/src/features/courses/timeline/useTimelineTransport.ts`

Required behavior:

- Use monotonic time through `performance.now()` or injected fake clock.
- `currentBeat` starts at `-countInBeats` after fresh start/restart.
- Pause freezes count-in, current beat, miss expiration, and pending chord expiration.
- Resume does not replay count-in.
- Restart returns to `-countInBeats` and clears gameplay state through the reducer.
- BPM change preserves musical beat and future target times.
- BPM change while playing auto-pauses and requires manual resume.
- Learner-facing seek is removed from `TransportControls` for this feature.

Implementation note: keep the low-level `seek` method if tests or internal debug utilities need it, but do not expose seek in the primary Guided Play UI unless explicitly requested later.

### 4.6 Falling Note Renderer

Add:

- `apps/client/src/features/courses/timeline/FallingNotesStage.tsx`
- `apps/client/src/features/courses/timeline/fallingNotesLayout.ts`
- `apps/client/src/features/courses/timeline/fallingNotesTypes.ts`
- `apps/client/src/features/courses/timeline/usePianoKeyGeometry.ts`

Responsibilities:

- Measure actual `CoursePiano` key buttons via `[data-note-id]`.
- Use `ResizeObserver` to update key geometry when the piano or viewport changes.
- Account for piano scroll container offset and horizontal scroll.
- Render only events inside the visible look-ahead and trailing window.
- Use CSS transforms, preferably `translate3d`, for moving note bars.
- Position strike line immediately above the piano and spanning measured playable width.
- Make note bar bottom edge the target point.
- Make note bar height proportional to `durationBeats`.
- Keep timing judgement independent from rendered position.
- Respect `prefers-reduced-motion`.

Recommended layout API:

```ts
type PianoKeyGeometry = {
  note: NoteId;
  tone: "white" | "black";
  left: number;
  width: number;
  centerX: number;
};

type FallingNoteLayout = {
  eventId: string;
  note: NoteId;
  left: number;
  width: number;
  height: number;
  translateY: number;
  zIndex: number;
};
```

### 4.7 CoursePiano Integration

Modify:

- `apps/client/src/features/courses/CoursePiano.tsx`

Preferred small changes:

- Keep `data-note-id` and `data-tone`; add a forwarded ref or a callback ref to expose the piano measurement root.
- Add source-aware input callback without breaking current callers:

```ts
onNoteAttempt?: (attempt: Omit<NoteAttempt, "timestampMs"> & { timestampMs?: number }) => void;
```

or keep `onInput(noteId)` and wrap source/timestamp in `TimelinePlayer`. The ref-based geometry work is more important than changing all existing callers at once.

Be careful not to break freestyle and existing `CoursePiano.test.tsx`.

### 4.8 TimelinePlayer Replacement

Modify:

- `apps/client/src/features/courses/timeline/TimelinePlayer.tsx`

Refactor into the unified Guided Play shell:

- Accept the normalized `ResolvedGuidedTimeline` plus lesson metadata, or internally resolve from lesson detail after `LessonPlayer` passes it.
- Remove practice-mode toggle from normal learner UI.
- Remove pause-on-miss recovery behavior.
- Remove horizontal `TimelineViewport` from normal Guided Play.
- Render:
  1. navigation/title
  2. score/combo/progress/tempo/status HUD
  3. `FallingNotesStage`
  4. strike line
  5. `CoursePiano`
  6. completion summary when done
- Use one `NoteAttempt` handler for keyboard and on-screen input.
- Ignore scoring input during count-in and pause.
- Allow audio preview during count-in only if explicitly chosen during implementation; default plan is to ignore note input entirely during count-in except audio warm-up on Play.
- Persist completion once.

### 4.9 LessonPlayer Routing

Modify:

- `apps/client/src/features/courses/LessonPlayer.tsx`

Steps:

- Keep route, loading, locked, not-found, and blocked states intact.
- Resolve every playable lesson via `resolveGuidedTimeline`.
- Render one `TimelinePlayer` / `GuidedPlayPlayer` path for both authored and generated lessons.
- Retire normal learner routing to `PlayerLoaded`.
- Decide whether to keep `?legacyPlayer=1` dev-only path temporarily. It can remain during migration if tests still need it, but final acceptance requires no normal learner route to render old step-by-step Guided Play.
- Stop using `lessonEngine.ts` for Guided Play progression.

### 4.10 Progress Storage

Modify:

- `apps/client/src/features/courses/progressStorage.ts`
- `apps/client/src/features/courses/courseTypes.ts`

Add optional rhythm fields while retaining existing base fields:

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

Compatibility:

- Retain `accuracy`, `durationMs`, `restartCount`, `correctInputs`, and `incorrectInputs` for older UI/tests.
- Derive legacy `accuracy` from completed non-wrong events divided by total events.
- Do not count wrong notes as missed events.
- Do not increment completion records more than once per completed playback.

## 5. Phased Work Plan

### Phase 0 - Test Inventory And Safety Net

Purpose: establish the current test surface before behavior changes.

Actions:

- Run targeted current tests:
  - `npm test -w @piano360/client -- --run apps/client/src/features/courses/timeline`
  - `npm test -w @piano360/client -- --run apps/client/src/features/courses/CoursePiano.test.tsx`
  - `npm test -w @piano360/client -- --run apps/client/src/features/courses/progressStorage.test.ts`
- Run typecheck when feasible:
  - `npm run typecheck -w @piano360/client`
- Record any unrelated failures before making implementation changes.

Deliverable:

- Baseline notes in the PR or implementation log.

### Phase 1 - Normalized Guided Timeline Resolver

Purpose: make lesson source differences disappear before UI/scoring work.

Actions:

- Add `resolveGuidedTimeline.ts`.
- Add generated defaults:

```ts
const GENERATED_TIMELINE_DEFAULTS = {
  originalBpm: 60,
  countInBeats: 4,
  eventSpacingBeats: 2,
  durationBeats: 1,
  timeSignature: { numerator: 4, denominator: 4 }
} as const;
```

- Preserve authored timing exactly.
- Convert legacy steps to generated events with stable IDs.
- Reject duplicate notes inside generated chord events.
- Return invalid state for empty step list.
- Decide how existing migration-blocked lesson data should surface:
  - If `mode: "migration-blocked"`, keep blocked UI.
  - If a legacy lesson has steps, generate timeline according to this spec.

Tests:

- `resolveGuidedTimeline.test.ts`
  - generated single-note timeline
  - generated chord timeline
  - two-beat spacing
  - one-beat duration
  - four-beat count-in
  - 60 BPM default
  - stable generated IDs
  - total beat calculation
  - authored preservation
  - duplicate chord note invalid
  - empty step list invalid

Acceptance for phase:

- Resolver tests pass.
- No React or browser APIs imported by the resolver.

### Phase 2 - Judge And Scoring Core

Purpose: implement rhythm-game correctness independent of UI.

Actions:

- Update `timingJudge.ts` or split pure helpers into `guidedPlayScoring.ts`.
- Add score constants:

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

- Add `EventResult` with `points`.
- Implement directional accepted classifications.
- Implement note-aware candidate selection.
- Implement chord pending collection and expiration.
- Ensure wrong notes do not consume events.
- Add reducer for score/combo/restart/completion state.

Tests:

- `timingJudge.test.ts`
  - exact boundaries `-250`, `-160`, `-80`, `0`, `+80`, `+160`, `+250`
  - `+251` expiration
  - early/late direction
  - wrong does not consume
  - closest valid matching event selection
  - repeated pitch events remain independent
  - duplicate chord input ignored
  - full chord any order
  - full chord least accurate note
  - incomplete chord partial
  - untouched chord missed
  - simultaneous event determinism

- `guidedPlayReducer.test.ts`
  - points per classification
  - wrong leaves score/combo unchanged
  - combo increment/reset rules
  - max combo
  - restart reset
  - summary totals

Acceptance for phase:

- Pure judge and reducer tests pass without React.
- Existing timing tests are updated for renamed `accepted` behavior.

### Phase 3 - Transport Semantics

Purpose: guarantee the authoritative clock behavior before renderer and input integration.

Actions:

- Tighten `TimelineClock.restart()` to rebase `anchorTimeMs` as needed.
- Ensure `setBpm()` preserves current beat and can be called while paused or playing.
- Expose methods needed for target timestamp conversion:
  - `beatToTimestampMs(beat)`
  - or a stable snapshot of `{ currentBeat, currentTimestampMs, selectedBpm }`.
- Ensure pause freezes miss/chord expiration by only expiring during active playing.
- Remove primary UI dependency on seek.
- Make `useTimelineTransport` expose phase-friendly state but keep `TimelineClock` pure.

Tests:

- `timelineTransport.test.ts`
  - count-in starts at `-countInBeats`
  - pause freezes beat
  - resume continues exactly
  - restart returns to count-in
  - BPM change preserves beat
  - BPM change while playing pauses when called through player/hook behavior
  - completion at total beats
  - no miss expiration while paused at player/reducer level

Acceptance for phase:

- Fake-clock tests prove musical beat is stable across pause/resume/BPM changes.

### Phase 4 - Input Unification

Purpose: route every note attempt through one timestamped path.

Actions:

- Add `noteInput.ts`.
- Update `useTimelineInput` to emit `NoteAttempt` instead of raw `NoteId`, or add a new `useGuidedNoteInput` and migrate the player to it.
- Preserve keyboard rules:
  - ignore `event.repeat`
  - ignore editable targets
  - prevent default only for mapped piano keys and player shortcuts
  - capture `performance.now()` before calling React setters
- Update `CoursePiano` integration:
  - timestamp pointer input immediately
  - mark source as `"on-screen-piano"`
  - keep audio and judgement using the same note identity
- Enforce disabled/count-in/paused state in the player before judging.

Tests:

- keyboard repeat ignored
- editable target ignored
- mapped key creates `NoteAttempt`
- on-screen key creates equivalent `NoteAttempt`
- count-in input ignored
- paused input ignored

Acceptance for phase:

- Keyboard and on-screen piano input reach the same handler shape.

### Phase 5 - Piano Geometry And Falling Layout

Purpose: build the alignment layer before replacing the viewport.

Actions:

- Add `usePianoKeyGeometry.ts`.
- Measure note buttons by `data-note-id`.
- Include `data-tone` in geometry for z-order and width decisions.
- Observe both piano container and key root with `ResizeObserver`.
- Recompute on scroll for non-fit piano mode.
- Add `fallingNotesLayout.ts` pure calculation helpers:
  - visible event filtering
  - bottom/height calculation
  - lane left/width mapping
  - z-index for black keys
- Use default windows:

```ts
const LOOK_AHEAD_BEATS = 4;
const TRAILING_BEATS = 1;
```

Tests:

- note aligns to supplied key geometry
- chord bars share target Y
- duration changes bar height
- visible-window filtering
- black notes use black lane geometry and z-index
- missing geometry omits or safely hides a note without crashing

Acceptance for phase:

- Layout functions are unit tested without browser layout.
- Hook behavior is covered where jsdom allows, with a `ResizeObserver` mock if needed.

### Phase 6 - FallingNotesStage Component

Purpose: implement the visual rhythm surface.

Actions:

- Add `FallingNotesStage.tsx`.
- Render vertical stage between HUD and `CoursePiano`.
- Render fixed strike line immediately above measured piano width.
- Use `requestAnimationFrame` for visual updates.
- Use transforms for note movement.
- Render only visible note events.
- Apply result state classes:
  - upcoming
  - current target
  - perfect
  - good
  - early/late
  - partial
  - missed
- Support long-note height.
- Respect `prefers-reduced-motion`.
- Do not move scoring into the renderer.

Tests:

- note target crosses strike line at target timestamp based on supplied clock snapshot
- result state classes render
- long note height is proportional
- visible window limits DOM nodes
- reduced motion avoids unnecessary animation styling

Acceptance for phase:

- `TimelineViewport` is no longer used by the Guided Play UI, but can remain for old tests/debug until cleanup.

### Phase 7 - TimelinePlayer Guided Play Integration

Purpose: wire resolver, transport, input, judge, scoring, renderer, piano, and progress.

Actions:

- Refactor `TimelinePlayer.tsx` around `ResolvedGuidedTimeline`.
- Replace inline summary with reducer/selectors.
- Remove practice mode UI from normal Guided Play.
- Remove pause-on-miss recovery.
- Remove seek from visible controls.
- On Play from idle/restart, warm audio and begin count-in.
- During count-in:
  - show audible/visual count-in if metronome support is retained
  - render upcoming notes
  - ignore scoring input
- During playing:
  - judge attempts using attempt timestamp and authoritative clock target times
  - expire missed/partial events based on monotonic time, not rendered position
  - update feedback and combo
- During pause:
  - freeze animation and expiration
  - ignore input for judgement
- On tempo change:
  - if playing, pause, apply tempo, preserve beat
  - if paused, apply immediately
  - save tempo percent
- On completion:
  - finalize all due events
  - persist once
  - show Replay, Continue/Next, Return to course

Tests:

- legacy step lesson renders falling notes
- authored timeline lesson renders falling notes
- keyboard and on-screen input produce identical result path
- input ignored during count-in
- input ignored while paused
- miss does not pause playback
- tempo change auto-pauses
- restart clears gameplay state
- completion persists once
- unlock progression remains functional

Acceptance for phase:

- Normal playable route uses falling-notes player for both legacy step and authored timeline lessons.

### Phase 8 - LessonPlayer Routing Cleanup

Purpose: remove normal learner split and keep old code from leaking into production behavior.

Actions:

- Replace `resolveLessonToTimeline` usage with `resolveGuidedTimeline`, or adapt routing so generated and authored lessons both produce the same player props.
- Keep blocked/missing/locked screens unchanged.
- Remove imports from `lessonEngine` where no longer used.
- Remove `PlayerLoaded` from normal route.
- Decide one of:
  - keep `PlayerLoaded` only behind dev-only `?legacyPlayer=1` while rollout is verified
  - remove `PlayerLoaded` entirely once tests and acceptance are complete
- Do not delete `lessonEngine.ts` until no tests or routes depend on it, unless the implementation scope includes cleanup.

Tests:

- locked lesson still shows lock screen
- not-found lesson still shows not-found screen
- playable step lesson reaches new player
- playable authored timeline reaches new player
- blocked migration lesson still shows controlled blocked UI if still represented in data

Acceptance for phase:

- No normal learner route renders the old step-by-step player.

### Phase 9 - Persistence Compatibility

Purpose: store new summary metrics without breaking old progress records.

Actions:

- Extend progress types with optional rhythm fields.
- Preserve `PROGRESS_STORAGE_KEY` unless a migration is explicitly needed.
- Ensure `recordLessonCompletion` still increments `completionCount`.
- Ensure completion is saved once per completed run.
- Derive legacy compatibility values:
  - `accuracy`
  - `correctInputs`
  - `incorrectInputs`
  - `durationMs`
  - `restartCount`
- Tolerate records missing new fields.

Tests:

- old record loads
- new record saves optional rhythm fields
- completion count increments
- completion save is idempotent per run
- wrong notes do not reduce score percent

Acceptance for phase:

- Existing progress UI and unlock behavior continue to work.

### Phase 10 - Responsive And Accessibility Pass

Purpose: ensure the new UI is usable across supported orientations.

Actions:

- Keep `MobileLandscapeShell`.
- Ensure desktop shows stage and piano without horizontal page scroll.
- Ensure mobile landscape keeps compact HUD, stage, and playable piano visible.
- For mobile portrait, preserve existing landscape recommendation or add a controlled compact mode only if alignment is reliable.
- Add accessible labels for transport controls.
- Use `aria-live="polite"` for feedback.
- Do not announce animation frames.
- Make color non-exclusive by using text labels for feedback.
- Keep visible keyboard focus.
- Honor reduced motion.

Tests:

- Mobile landscape shell regression.
- Feedback live region renders.
- Transport buttons have accessible names.
- Reduced-motion state is respected.

Acceptance for phase:

- Layout does not overlap or misalign piano lanes in supported viewports.

## 6. Validation Matrix

Run as relevant during implementation:

```powershell
npm test -w @piano360/client -- --run apps/client/src/features/courses/timeline/resolveGuidedTimeline.test.ts
npm test -w @piano360/client -- --run apps/client/src/features/courses/timeline/timingJudge.test.ts
npm test -w @piano360/client -- --run apps/client/src/features/courses/timeline/guidedPlayReducer.test.ts
npm test -w @piano360/client -- --run apps/client/src/features/courses/timeline/timelineTransport.test.ts
npm test -w @piano360/client -- --run apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx
npm test -w @piano360/client -- --run apps/client/src/features/courses/CoursePiano.test.tsx
npm test -w @piano360/client -- --run apps/client/src/features/courses/progressStorage.test.ts
npm test -w @piano360/client
npm run typecheck -w @piano360/client
npm run lint
npm run build -w @piano360/client
```

If root-level validation is required:

```powershell
npm run test
npm run typecheck
npm run build
```

When validating locally, keep API/Mongo startup failures separate from client validation. The falling-notes implementation is client-side and should not depend on Mongo unless full root `dev` behavior is being checked.

## 7. Manual QA Scenarios

Use at least one generated step lesson and one authored timeline lesson.

Scenarios:

- Fresh start shows count-in and upcoming notes.
- Input during count-in does not score.
- Correct single note at target scores and increments combo.
- Early and late inputs produce directional feedback.
- Wrong note plays audio/feedback but does not consume the event.
- Missed note continues past strike line and playback does not pause.
- Chord notes can be entered in any order.
- Partial chord expires as partial.
- Restart clears score, combo, feedback, judged events, and pending chord.
- Pause freezes note positions and miss expiration.
- Resume continues without replaying count-in.
- Tempo change while playing pauses and preserves beat.
- Completion saves once and unlocks the next lesson.
- Replay starts from count-in and does not duplicate prior completion until it completes again.
- Mobile landscape keeps piano and falling stage aligned.

## 8. Cleanup Candidates After Acceptance

Only after the new path is accepted:

- Remove `PlayerLoaded` from `LessonPlayer.tsx` if no debug path is required.
- Remove or archive `lessonEngine.ts` and `lessonEngine.test.ts` if no remaining feature depends on them.
- Remove `TimelineViewport` from learner-facing code. Keep it only if it remains useful for internal debug/tests.
- Rename old `resolveLessonToTimeline` tests or adapt them to the new resolver if the old Phase A migration layer is removed.
- Remove `TimelinePracticeMode` UI assumptions from code paths no longer reachable by learners.

## 9. Primary Risks And Mitigations

- Key geometry drift:
  - Mitigate by measuring actual `CoursePiano` key elements and observing resize/scroll.

- Timing drift from React rendering:
  - Mitigate by judging from timestamped input and monotonic transport snapshots, not DOM position.

- Chord edge cases:
  - Mitigate with pure judge tests before UI integration.

- Existing progress compatibility:
  - Mitigate by adding optional fields and preserving legacy summary values.

- Scope creep into content migration:
  - Mitigate by generating timelines for step lessons and leaving seed/database migration out of scope.

- Stale local Vite state during QA:
  - Mitigate by verifying the active Vite URL and port before treating browser failures as code regressions.

## 10. Definition Of Done

- Every unlocked playable lesson route renders falling notes.
- Legacy step lessons generate timelines with 2-beat spacing, 1-beat duration, 4-beat count-in, and 60 BPM.
- Authored timelines preserve exact rhythm and duration data.
- Notes and chords align to measured piano keys.
- Long notes render proportional height while only note-on is scored.
- Timing feedback supports Perfect, Good, Early, Late, Partial, Missed, and Wrong.
- Scores and combo follow the spec exactly.
- Wrong notes do not consume expected events or lower score.
- Misses do not pause playback.
- Pause, resume, restart, and tempo changes follow the spec.
- Keyboard and on-screen piano share one note-attempt path.
- Count-in and pause ignore scoring input.
- Completion saves once and preserves unlock progression.
- Required unit/integration/regression tests are added or updated.
- Client typecheck, lint, build, and test suite pass or any unrelated failures are documented.
