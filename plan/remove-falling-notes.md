# Remove Falling Notes Implementation Plan

## Document Status

- **Repository:** `kofiarhin/piano360`
- **Target branch:** `main`
- **Source specification:** [`spec/remove-falling-notes.md`](../spec/remove-falling-notes.md)
- **Inspected baseline before documentation:** `5e2cb82d797902788a9d7f0f17a1f3a58f834496`
- **Implementation status:** Not started
- **Current request boundary:** Documentation only; do not execute this plan until separately instructed.

## 1. Implementation Goal

Remove `FallingNotesStage` and all falling-note-only client code while preserving the existing timeline runtime and using `CoursePiano.targetNotes` as the only visual note suggestion system.

The implementation must be a focused client cleanup, not a rewrite of the lesson engine.

## 2. Verified Current-Code Findings

### 2.1 Target Notes Already Exist Independently of Falling Notes

`TimelinePlayer` already calculates:

```ts
const activeTargetEvent = stopWaitEvent ?? recoveryEvent ?? nextUnjudgedEvent;
const targetNotes = activeTargetEvent?.notes ?? [];
```

The piano already receives:

```tsx
targetNotes={completed ? [] : targetNotes}
autoScrollNotes={targetNotes}
```

Therefore, no new target-selection state or visual component is required.

### 2.2 Falling Notes Add a Parallel Visual Layer

The current falling-note path consists of:

- `FallingNotesStage` rendering;
- stage and piano refs;
- `usePianoKeyGeometry` measurement;
- `fallingNotesLayout` calculations;
- `fallingNotesTypes` geometry/layout types;
- result-classification mapping;
- stop-and-wait display-event filtering;
- falling-note CSS and animations;
- dedicated unit tests.

### 2.3 One Falling-Note Constant Has Runtime Responsibility

`LOOK_AHEAD_BEATS` is defined in `fallingNotesLayout.ts`, but `TimelinePlayer` also uses it when resuming after:

- assisted recovery confirmation;
- stop-and-wait event confirmation.

This dependency must be separated before deleting `fallingNotesLayout.ts`.

### 2.4 Responsive CSS Reserves Stage Space

The mobile landscape workspace currently includes a dedicated `5rem` row and `.timeline-viewport` height for the falling-note stage. Removing JSX without updating these rules would leave incorrect spacing or constrain the piano.

## 3. Implementation Principles

1. Write or update integration tests before removing production behavior.
2. Preserve the active-target precedence exactly.
3. Preserve the four-beat next-event lead-in exactly.
4. Remove falling-note code by responsibility, not by broad file deletion.
5. Do not modify course data, lesson timing, scoring, transport, persistence, or APIs.
6. Keep `CoursePiano` unchanged unless a failing acceptance test proves a minimal adjustment is required.
7. Validate each cleanup phase before deleting the next dependency layer.
8. Do not retain dead compatibility aliases for the removed visual feature.

## 4. Planned File Changes

### 4.1 Modify

- `apps/client/src/features/courses/timeline/TimelinePlayer.tsx`
- `apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx`
- `apps/client/src/timeline-player-enhancements.css`
- `apps/client/src/styles.css`

### 4.2 Delete After Reference Verification

- `apps/client/src/features/courses/timeline/FallingNotesStage.tsx`
- `apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx`
- `apps/client/src/features/courses/timeline/fallingNotesLayout.ts`
- `apps/client/src/features/courses/timeline/fallingNotesLayout.test.ts`
- `apps/client/src/features/courses/timeline/fallingNotesTypes.ts`
- `apps/client/src/features/courses/timeline/usePianoKeyGeometry.ts`
- `apps/client/src/features/courses/timeline/usePianoKeyGeometry.test.tsx`

### 4.3 Expected No Production Change

- `apps/client/src/features/courses/CoursePiano.tsx`
- `apps/client/src/features/courses/LessonPlayer.tsx`
- timeline judgement, scoring, recovery, stop-and-wait, input, transport, and persistence modules
- API files
- course seed files

## 5. Phase 0 — Establish a Clean Baseline

### Purpose

Record the current test and type-check state before implementation so unrelated failures are not attributed to the feature.

### Actions

1. Confirm the working ref is the intended current `main` commit.
2. Install dependencies if the workspace is not already prepared.
3. Run targeted client tests:

```bash
npm test -w @piano360/client -- --run \
  apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx \
  apps/client/src/features/courses/CoursePiano.test.tsx \
  apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx \
  apps/client/src/features/courses/timeline/fallingNotesLayout.test.ts \
  apps/client/src/features/courses/timeline/usePianoKeyGeometry.test.tsx
```

4. Run client type checking:

```bash
npm run typecheck -w @piano360/client
```

5. Record any pre-existing failures before changing files.

### Exit Criteria

- Baseline results are known.
- Any unrelated failure is documented.
- The implementation starts from the current `main` state.

## 6. Phase 1 — Add Target-Key Integration Coverage First

### Purpose

Create a safety net for the desired behavior before removing the existing visual layer.

### File

`apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx`

### Actions

1. Update the compact-layout test so it no longer defines the falling-note lane as required behavior.
2. Add an assertion that the virtual piano remains present.
3. Add a single-note target test:
   - render a timeline whose active event targets `C4`;
   - assert the C4 piano key has the existing target visual-state class;
   - assert a non-target key does not have the target class.
4. Add a black-key target test if not already covered through integration:
   - target `C#4`;
   - assert the black key receives the target state.
5. Add a chord target test:
   - render an event with `notes: ["C4", "E4", "G4"]`;
   - assert all three keys receive the target state simultaneously.
6. Add an event-advance test:
   - use two sequential events;
   - advance the runtime through the first event;
   - assert the highlighted key moves to the second event.
7. Add or update a stop-and-wait test:
   - before input, assert the active stop-and-wait key is targeted;
   - after event completion and confirmation, assert the next event becomes targeted.
8. Add or update an assisted-recovery test:
   - cause recovery;
   - assert the recovery event's key remains the target source.
9. Add a completion test:
   - complete the lesson;
   - assert no key retains the target state.
10. Add absence assertions that will pass only after removal:

```ts
expect(screen.queryByTestId("falling-notes-stage")).not.toBeInTheDocument();
expect(screen.queryByTestId("timeline-note-lane")).not.toBeInTheDocument();
```

### Test Robustness Guidance

- Prefer accessible key queries by note and tone.
- Use the established `CoursePiano` target class contract rather than snapshots.
- Do not assert the rendered CSS override color from `piano-highlight.css`; assert the component state class already used by existing tests.
- Keep runtime behavior assertions separate from purely structural absence assertions.

### Exit Criteria

- New tests describe the target-key-only experience.
- Tests fail only where falling-note removal has not yet occurred.
- Existing behavior tests remain intact.

## 7. Phase 2 — Decouple Runtime Lead-In Timing

### Purpose

Prevent accidental behavior change when deleting `fallingNotesLayout.ts`.

### File

`apps/client/src/features/courses/timeline/TimelinePlayer.tsx`

### Actions

1. Remove the import of `LOOK_AHEAD_BEATS` from `fallingNotesLayout.ts`.
2. Introduce a neutral runtime constant near the existing confirmation constants:

```ts
const NEXT_EVENT_LEAD_IN_BEATS = 4;
```

3. Replace both runtime uses:
   - assisted recovery resume seek;
   - stop-and-wait next-event seek.
4. Do not change the value or seek formula:

```ts
Math.max(0, nextEvent.startBeat - NEXT_EVENT_LEAD_IN_BEATS)
```

5. Run the existing assisted recovery and stop-and-wait tests before continuing.

### Exit Criteria

- `TimelinePlayer` no longer imports runtime behavior from a visual layout module.
- Recovery and stop-and-wait lead-in tests pass unchanged.
- The four-beat behavior remains explicit and documented.

## 8. Phase 3 — Remove Falling-Note Runtime Dependencies from `TimelinePlayer`

### Purpose

Make `CoursePiano` the only visual note suggestion surface while preserving all runtime state.

### File

`apps/client/src/features/courses/timeline/TimelinePlayer.tsx`

### Actions

#### 8.1 Remove Imports

Remove:

- `FallingNotesStage`;
- `usePianoKeyGeometry`;
- falling-note layout imports;
- `TimingClassification` if no longer required after deleting result mapping.

Retain `useRef` because timeline judge state and timers still require refs.

#### 8.2 Remove Falling-Note Refs and Geometry

Remove:

```ts
const stageRef = useRef<HTMLElement | null>(null);
const pianoRef = useRef<HTMLElement | null>(null);
const geometry = usePianoKeyGeometry(pianoRef, stageRef);
```

Do not remove refs used by judge state, save guards, or confirmation timers.

#### 8.3 Remove Result Mapping

Delete `scoreableResults` because event classifications no longer need to be converted for a visual renderer.

Confirm `EventResult` is still required by `applyResults`. Remove only the now-unused `TimingClassification` import.

#### 8.4 Remove Display-Only Event Filtering

Delete:

```ts
const displayEvents = stopWaitEnabled
  ? noteEvents.filter((event) => !stopWaitState.completedEventIds.includes(event.id))
  : noteEvents;
```

This value is used only to hide completed bars from the falling-note stage. Do not change `noteEvents`, `nextUncompletedEvent`, or completed-event tracking.

#### 8.5 Remove Falling-Note JSX

Delete the `FallingNotesStage` element and its props.

Remove the `timeline-player-note-lane` wrapper if it only groups the stage and piano.

Render `CoursePiano` directly as the workspace's piano section.

#### 8.6 Preserve Piano Props

Keep:

```tsx
className="timeline-player-piano"
targetNotes={completed ? [] : targetNotes}
activeNotes={activeNotes}
wrongNotes={wrongNotes}
autoScrollNotes={targetNotes}
fitToContainer={mobileLandscapeActive}
size={mobileLandscapeActive ? "compact" : "standard"}
orientationMode={mobileLandscapeActive ? "mobile-landscape" : "responsive"}
onInput={handlePianoInput}
onRelease={handlePianoRelease}
onPrepareAudio={warmAudio}
```

Remove only `ref={pianoRef}` because it existed for falling-note alignment.

#### 8.7 Preserve Active-Target Logic

Do not change:

```ts
const activeTargetEvent = stopWaitEvent ?? recoveryEvent ?? nextUnjudgedEvent;
const targetNotes = activeTargetEvent?.notes ?? [];
```

### Exit Criteria

- `TimelinePlayer` renders no falling-note component or empty lane.
- `CoursePiano` remains fully wired.
- Target-key integration tests pass.
- Existing timeline runtime tests pass.
- TypeScript reports no unused imports or values.

## 9. Phase 4 — Update Responsive Layout and General CSS

### Purpose

Remove reserved stage space and falling-note-only styles without damaging general timeline density rules.

### 9.1 `apps/client/src/styles.css`

#### Actions

1. Update the mobile landscape timeline workspace rows.
2. Replace the stage-specific row model:

```css
grid-template-rows: auto auto auto 5rem minmax(0, 1fr);
```

with a model where the piano is the flexible row and completion is optional, for example:

```css
grid-template-rows: auto auto auto minmax(0, 1fr) auto;
```

3. Remove the `.timeline-viewport` fixed-height rule if no remaining component uses the class.
4. Keep piano sizing rules, status rules, transport rules, and rotated mobile shell behavior.
5. Verify that an absent completion section does not reserve visible space.

### 9.2 `apps/client/src/timeline-player-enhancements.css`

#### Keep

- timeline header density;
- workspace density;
- transport sizing;
- progress-track sizing;
- status sizing;
- completion layout;
- general desktop/tablet workspace rules.

#### Remove

- `.timeline-player-note-lane`;
- `.timeline-falling-notes-stage`;
- `.timeline-falling-notes-viewport` and pseudo-element;
- `.timeline-falling-note`;
- `.timeline-falling-note--hit`;
- `.timeline-hit-impact` and pseudo-element;
- `.timeline-hit-particle` and nth-child variables;
- `.timeline-key-hit-glow`;
- all falling-note hit/particle/glow keyframes;
- desktop, tablet, and mobile stage-height overrides;
- falling-note-specific reduced-motion rules.

### 9.3 Visual Verification Sizes

Verify at least:

- 1280x900 desktop;
- 1024x768 tablet landscape;
- 740x390 mobile landscape;
- a narrow portrait viewport before the landscape shell activates.

### Exit Criteria

- No empty visual lane remains.
- The piano receives the flexible viewport area.
- Controls remain visible and usable.
- No falling-note selector remains unless explicitly documented as shared.

## 10. Phase 5 — Delete Falling-Note-Only Modules

### Purpose

Remove dead code after the integration path and CSS no longer depend on it.

### Pre-Deletion Reference Search

Run from the repository root:

```bash
rg -n \
  "FallingNotesStage|falling-notes-stage|falling-note|timeline-note-lane|timeline-viewport|fallingNotesLayout|fallingNotesTypes|usePianoKeyGeometry|PianoKeyGeometry|FallingNoteLayout" \
  .
```

Review every result before deleting files.

### Delete

```text
apps/client/src/features/courses/timeline/FallingNotesStage.tsx
apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx
apps/client/src/features/courses/timeline/fallingNotesLayout.ts
apps/client/src/features/courses/timeline/fallingNotesLayout.test.ts
apps/client/src/features/courses/timeline/fallingNotesTypes.ts
apps/client/src/features/courses/timeline/usePianoKeyGeometry.ts
apps/client/src/features/courses/timeline/usePianoKeyGeometry.test.tsx
```

### Deletion Rules

- Delete `fallingNotesLayout.ts` only after the lead-in constant is relocated.
- Do not move obsolete types into another file merely to avoid deletion.
- Do not keep empty test files.
- Do not remove shared timing, transport, scoring, or piano code.

### Exit Criteria

- Dedicated falling-note modules and tests are gone.
- No unresolved imports remain.
- The reference search returns no unintended falling-note implementation references.

## 11. Phase 6 — Complete Test Updates

### Purpose

Ensure tests represent the new product contract rather than the removed implementation.

### Timeline Player Suite

Update the existing structural test:

- keep header, transport, status, piano, play, restart, and tempo assertions;
- remove the requirement for `.timeline-player-note-lane`;
- assert falling-note elements are absent.

Replace the existing stop-and-wait assertion that checks:

```ts
falling-notes-stage[data-recovery-locked="true"]
```

with behavior-focused assertions:

- the correct target key is indicated before input;
- status and transport lock correctly;
- the pressed key becomes active while held;
- the next target is indicated after confirmation.

Keep all existing tests for:

- keyboard/on-screen parity;
- count-in and paused scoring rules;
- incomplete chord feedback;
- tempo auto-pause;
- wrong-note feedback;
- completion persistence and replay;
- stop-and-wait lock and non-expiry;
- strike-line press acceptance semantics;
- wrong stop-and-wait input;
- release-before-advance;
- hold progress;
- early release retry;
- restart timer cleanup;
- manual pause separation;
- assisted recovery;
- performance continuity.

### Course Piano Suite

Run unchanged as regression coverage unless the implementation unexpectedly requires a minimal update.

Do not weaken target-state, active-state, wrong-state, pointer, release, or fit-to-container assertions.

### Exit Criteria

- No test imports a deleted falling-note module.
- No test requires falling-note DOM.
- Target-key-only behavior is covered at integration level.
- Runtime behavior coverage is preserved.

## 12. Phase 7 — Static and Automated Validation

### 12.1 Focused Client Validation

```bash
npm test -w @piano360/client -- --run \
  apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx \
  apps/client/src/features/courses/CoursePiano.test.tsx

npm run typecheck -w @piano360/client
npm run build -w @piano360/client
```

### 12.2 Full Repository Validation

```bash
npm test
npm run typecheck
npm run build
npm run lint
npm run format:check
```

### 12.3 Reference Validation

```bash
rg -n \
  "FallingNotesStage|falling-notes-stage|falling-note|timeline-note-lane|timeline-viewport|fallingNotesLayout|fallingNotesTypes|usePianoKeyGeometry|PianoKeyGeometry|FallingNoteLayout" \
  apps tests
```

Expected result: no production or test references to the removed feature, except documentation that intentionally describes the removal.

### Exit Criteria

- Focused tests pass.
- Full test suite passes.
- Type checking passes.
- Builds pass.
- Lint and formatting pass.
- No orphan references remain.

## 13. Phase 8 — Manual Acceptance Verification

### Desktop and Tablet

For representative single-note, chord, stop-and-wait, assisted, and performance lessons:

1. Open the lesson.
2. Confirm no falling-note lane appears.
3. Confirm the target key is highlighted.
4. Confirm a chord highlights every required key.
5. Start playback and confirm target guidance advances.
6. Enter a wrong note and confirm wrong feedback appears without losing the expected target state after transient feedback.
7. Complete an event and confirm the next target appears.
8. Complete the lesson and confirm target highlighting clears.
9. Replay and confirm target guidance resets.
10. Change tempo and confirm current behavior is preserved.

### Mobile Landscape

1. Use the existing mobile landscape shell.
2. Confirm the piano fills the remaining workspace.
3. Confirm transport and status remain visible.
4. Confirm no blank five-rem stage row remains.
5. Confirm all keys remain tappable.
6. Confirm target notes remain visible and fit-to-container behavior is unchanged.

### Horizontal Piano Scrolling

On a viewport that permits horizontal piano scrolling:

1. Select a lesson whose target is initially outside the visible key range.
2. Confirm `autoScrollNotes` brings the target into view.
3. Manually scroll the piano and confirm existing auto-scroll resume behavior remains intact.

## 14. Phase 9 — Change Review Checklist

Before considering implementation complete, review the diff for the following:

- Only client files required by the specification changed.
- No lesson data changed.
- No API or database files changed.
- No timing windows changed.
- No score values changed.
- No transport behavior changed.
- `NEXT_EVENT_LEAD_IN_BEATS` remains `4`.
- `activeTargetEvent` precedence remains unchanged.
- `targetNotes={completed ? [] : targetNotes}` remains unchanged.
- `autoScrollNotes={targetNotes}` remains unchanged.
- No target-key styling was redesigned.
- No broad CSS deletion removed unrelated timeline styles.
- No deleted module remains referenced.
- No empty lane or stage placeholder remains.

## 15. Suggested Implementation Commit Sequence

When this plan is later executed, keep commits reviewable:

1. **`test: define target-key-only timeline guidance`**
   - update/add integration tests;
   - no production behavior removal yet.

2. **`refactor: decouple timeline lead-in from falling notes`**
   - relocate the four-beat constant;
   - preserve behavior.

3. **`feat: remove falling notes from timeline lessons`**
   - remove `FallingNotesStage` rendering and runtime geometry dependencies;
   - render `CoursePiano` directly.

4. **`chore: remove falling note modules and styles`**
   - delete orphan files/tests;
   - clean responsive CSS and animations.

5. **`test: finalize target-key guidance coverage`**
   - complete any remaining integration and responsive regression updates.

If work must be delivered as one commit, preserve the same internal phase order before committing.

## 16. Rollback Strategy

If validation finds a runtime regression:

1. Restore `TimelinePlayer` JSX and imports before restoring deleted files.
2. Restore falling-note modules and tests as one coherent set.
3. Restore the original mobile landscape grid row and CSS selectors.
4. Keep the neutral runtime lead-in constant if it is behaviorally equivalent; it is an architectural improvement independent of the visual rollback.
5. Re-run focused timeline tests before investigating further.

Do not attempt to fix a scoring, transport, or recovery regression by changing lesson data.

## 17. Completion Criteria

Implementation is complete only when:

- `FallingNotesStage` is not rendered;
- falling-note-only modules and tests are removed;
- falling-note-only CSS and animations are removed;
- no empty visual lane remains;
- the active note or chord is indicated exclusively through `CoursePiano`;
- target guidance advances and clears correctly;
- recovery and stop-and-wait lead-in behavior is unchanged;
- runtime, persistence, scoring, and transport tests remain green;
- responsive manual checks pass;
- focused and full repository validation pass.

## 18. Explicit Non-Implementation Boundary for This Document

Creating this plan does not authorize or perform any production-code, test-code, style, or deletion work. Execution begins only after a separate explicit instruction to implement the approved specification and plan.