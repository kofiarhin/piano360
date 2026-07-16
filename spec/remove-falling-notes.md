# Remove Falling Notes and Use Piano Key Suggestions

## Document Status

- **Repository:** `kofiarhin/piano360`
- **Target branch:** `main`
- **Inspected baseline:** `5e2cb82d797902788a9d7f0f17a1f3a58f834496`
- **Document type:** Product and technical specification
- **Implementation status:** Not started

## 1. Objective

Remove the falling-note visualization from all normal timeline lessons and make the existing `CoursePiano` target-key highlighting the sole visual note suggestion system.

The change must simplify the learner-facing lesson UI without changing timeline playback, lesson data, timing judgement, scoring, recovery, stop-and-wait behavior, tempo control, progress persistence, course progression, audio, or completion semantics.

## 2. Current System

Normal playable lessons are resolved to a `ResolvedGuidedTimeline` and rendered through `TimelinePlayer`.

`TimelinePlayer` currently:

1. Determines the active target event using the existing runtime-mode state.
2. Derives `targetNotes` from that event.
3. Renders `FallingNotesStage` using measured piano-key geometry.
4. Renders `CoursePiano` and passes the same target notes through `targetNotes` and `autoScrollNotes`.

The current target-event precedence is:

```ts
const activeTargetEvent = stopWaitEvent ?? recoveryEvent ?? nextUnjudgedEvent;
const targetNotes = activeTargetEvent?.notes ?? [];
```

`CoursePiano` already provides the required suggestion behavior:

- one target note highlights one key;
- a chord target highlights every note in the chord;
- active/correct input visually overrides the target state;
- wrong input visually overrides all other states;
- target notes are automatically scrolled into view when the piano is horizontally scrollable;
- completed lessons pass an empty target list.

## 3. Desired Learner Experience

### 3.1 Standard Timeline Practice

The learner sees the virtual piano without a falling-note lane above it.

The next expected note is indicated directly on the piano keyboard. When the expected event is a chord, all required keys are highlighted simultaneously.

### 3.2 Stop-and-Wait Mode

During approach, waiting, hold, release, retry, and confirmation states:

- the current stop-and-wait event remains the target source;
- the required piano key or keys remain indicated through `CoursePiano`;
- existing text prompts such as `Next: C4`, `Play C4`, `Hold C4`, `Release`, and chord prompts remain unchanged;
- transport locking and event advancement remain unchanged.

### 3.3 Assisted Recovery Mode

When an event enters recovery:

- the recovery event becomes the target source;
- its required piano key or keys remain highlighted;
- existing recovery prompts, input handling, hold/release behavior, confirmation delay, and transport resume behavior remain unchanged.

### 3.4 Performance Mode

The next unjudged timeline event remains the target source, matching current behavior.

Removing falling notes must not alter judgement windows, scoring, score accumulation, combo handling, miss expiration, or completion eligibility.

### 3.5 Lesson Completion

When the lesson is complete:

- `CoursePiano` receives `targetNotes={[]}`;
- no target key remains highlighted;
- the completion summary, replay action, and navigation action remain unchanged.

## 4. Functional Requirements

### FR-1: Remove Falling-Note Rendering

`TimelinePlayer` must not render:

- `FallingNotesStage`;
- the falling-note viewport;
- the strike line;
- falling-note bars;
- hit particles;
- falling-note key-column glow;
- the `timeline-note-lane` wrapper when it has no remaining layout purpose.

### FR-2: Keep Existing Target Selection

The target note source must continue to use the current active-event precedence:

1. active stop-and-wait event;
2. active recovery event;
3. next unjudged event.

This precedence must not be recalculated from animation position or current visual layout.

### FR-3: Use `CoursePiano` as the Sole Visual Suggestion Surface

`TimelinePlayer` must continue passing:

```tsx
targetNotes={completed ? [] : targetNotes}
autoScrollNotes={targetNotes}
```

No second visual note queue, staff notation, text queue, or replacement animation is required.

### FR-4: Preserve Chord Suggestions

For an active event containing multiple notes, every note in `event.notes` must be present in `CoursePiano.targetNotes` simultaneously.

Chord note order must not affect visual indication or input acceptance.

### FR-5: Preserve Key-State Priority

The existing `CoursePiano` visual-state priority must remain unchanged:

1. wrong;
2. correct or active;
3. target;
4. idle.

The change must not redesign target, active, correct, wrong, white-key, or black-key styles.

### FR-6: Preserve Piano Auto-Scroll

On responsive layouts where the piano can scroll horizontally, the active target note or chord must continue to be centered or brought into view through `autoScrollNotes`.

Mobile landscape `fitToContainer` behavior must remain unchanged.

### FR-7: Preserve Runtime Behavior

The following must be behaviorally unchanged:

- play;
- count-in;
- pause;
- resume;
- restart;
- tempo changes;
- beat progress;
- keyboard input;
- on-screen piano press and release input;
- audio warm-up and note playback;
- standard timing judgement;
- chord collection;
- hold judgement;
- wrong-note feedback;
- miss expiration;
- assisted recovery;
- stop-and-wait approach and lock;
- stop-and-wait hold and release;
- score, combo, rhythm percentage, mastered, retry, and wrong counters;
- completion persistence;
- replay and next-lesson navigation.

### FR-8: Preserve Recovery and Stop-and-Wait Lead-In Timing

`LOOK_AHEAD_BEATS` currently belongs to `fallingNotesLayout.ts`, but it is also used by `TimelinePlayer` to seek before the next event after:

- assisted recovery confirmation;
- stop-and-wait success confirmation.

Removing the falling-note layout must not remove or change this runtime timing behavior.

The implementation must move or rename the value to a neutral runtime concept, for example:

```ts
const NEXT_EVENT_LEAD_IN_BEATS = 4;
```

The value must remain `4` unless a separate product change is approved.

### FR-9: Remove Falling-Note-Only Runtime Work

The timeline player must no longer perform DOM measurement or rendering work needed only by falling notes, including:

- stage refs;
- piano refs used only for stage alignment;
- `usePianoKeyGeometry` subscriptions;
- key geometry state;
- display-event filtering used only by the falling-note renderer;
- conversion of event results into falling-note visual classifications.

### FR-10: Remove Orphaned Falling-Note Modules

After repository-wide reference verification, modules used exclusively by the removed feature should be deleted:

- `FallingNotesStage.tsx`;
- `fallingNotesLayout.ts` after relocating the runtime lead-in constant;
- `fallingNotesTypes.ts`;
- `usePianoKeyGeometry.ts`;
- dedicated tests for those modules.

No file may be deleted while still imported by a non-falling-notes surface.

## 5. Layout and Responsive Requirements

### 5.1 Desktop and Tablet

- The piano should occupy the lesson content area previously shared with the falling-note lane.
- No empty bordered stage or reserved vertical gap may remain.
- Header, transport, status, piano, and completion sections must retain consistent spacing.
- The piano must remain fully interactive and horizontally scrollable where required.

### 5.2 Mobile Landscape

The current mobile landscape workspace reserves a dedicated `5rem` row for the falling-note viewport. That row must be removed from the grid definition.

The remaining layout should allocate rows for:

1. header;
2. transport;
3. status;
4. piano as the flexible content row;
5. optional completion content.

The piano must remain usable within the available viewport without introducing page-level scrolling or clipping required controls.

### 5.3 Portrait and Small Screens

Removing the stage must not break the existing rotated mobile-landscape shell behavior or the standard responsive piano layout.

## 6. Styling Requirements

### 6.1 Remove Falling-Note Styles

Remove CSS selectors and keyframes that exist only for:

- `.timeline-player-note-lane`;
- `.timeline-falling-notes-stage`;
- `.timeline-falling-notes-viewport`;
- `.timeline-falling-note`;
- `.timeline-falling-note--hit`;
- `.timeline-hit-impact`;
- `.timeline-hit-particle`;
- `.timeline-key-hit-glow`;
- falling-note hit, pulse, particle, and key-glow animations;
- falling-note-specific responsive heights;
- falling-note-specific reduced-motion behavior;
- `.timeline-viewport` height rules when no other component uses the class.

### 6.2 Preserve General Timeline Styles

Keep the non-falling-note density and layout rules in `timeline-player-enhancements.css`, including general styles for:

- timeline page header;
- workspace spacing;
- transport;
- progress track;
- status;
- completion;
- desktop and tablet workspace sizing.

The stylesheet may retain its current filename because it still contains timeline-player layout enhancements.

### 6.3 Preserve Piano Highlight Styling

Do not modify:

- `CoursePiano` target-state class selection;
- active, correct, or wrong state selection;
- `piano-highlight.css` overrides;
- shortcut badges;
- note labels;
- key geometry or key sizing.

## 7. Architecture and Data Boundaries

### 7.1 Client-Only UI Change

This feature is limited to the React client.

No API, MongoDB, seed-course, schema, route, or response-contract change is required.

### 7.2 Timeline Data Remains Authoritative

Do not modify:

- `ResolvedGuidedTimeline`;
- `TimedNoteEvent`;
- lesson BPM;
- count-in beats;
- event start beats;
- event durations;
- event note arrays;
- total beats;
- timing source metadata.

### 7.3 Persistence Remains Unchanged

Do not modify:

- `piano360.progress.v1`;
- completion metrics;
- completion count behavior;
- tempo storage;
- unlock logic.

## 8. File Impact Matrix

### Modify

| File | Required change |
| --- | --- |
| `apps/client/src/features/courses/timeline/TimelinePlayer.tsx` | Remove falling-note rendering, geometry, result mapping, display filtering, and stage wrapper; keep `CoursePiano` target-note behavior; relocate the four-beat runtime lead-in constant. |
| `apps/client/src/timeline-player-enhancements.css` | Remove falling-note-only selectors, animations, media rules, and reduced-motion rules while preserving general timeline layout styling. |
| `apps/client/src/styles.css` | Remove the mobile landscape falling-note row and obsolete `.timeline-viewport` sizing; make the piano the flexible row. |
| `apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx` | Replace falling-note assertions with target-key and no-stage assertions while preserving behavioral tests. |

### Delete After Reference Check

| File | Reason |
| --- | --- |
| `apps/client/src/features/courses/timeline/FallingNotesStage.tsx` | Removed visual component. |
| `apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx` | Tests only the removed component. |
| `apps/client/src/features/courses/timeline/fallingNotesLayout.ts` | Falling-note layout is removed; move the runtime lead-in value first. |
| `apps/client/src/features/courses/timeline/fallingNotesLayout.test.ts` | Tests only the removed layout. |
| `apps/client/src/features/courses/timeline/fallingNotesTypes.ts` | Types only support falling-note geometry/layout. |
| `apps/client/src/features/courses/timeline/usePianoKeyGeometry.ts` | Geometry measurement only aligns falling notes to piano keys. |
| `apps/client/src/features/courses/timeline/usePianoKeyGeometry.test.tsx` | Tests only the removed geometry hook. |

### Expected No Change

| File or area | Reason |
| --- | --- |
| `apps/client/src/features/courses/CoursePiano.tsx` | Already implements the required target-key suggestion behavior. |
| `apps/client/src/features/courses/CoursePiano.test.tsx` | Existing target, active, wrong, chord, and responsive behavior remains valid as a regression suite. |
| `apps/client/src/features/courses/LessonPlayer.tsx` | Timeline-player routing is unchanged. |
| `apps/client/src/features/courses/timeline/timingJudge.ts` | Judgement logic is unrelated to the visual removal. |
| `apps/client/src/features/courses/timeline/guidedRecovery.ts` | Recovery state remains unchanged. |
| `apps/client/src/features/courses/timeline/guidedStopWait.ts` | Stop-and-wait state remains unchanged. |
| API and seed-course files | No data or backend change is required. |

## 9. Test Requirements

### 9.1 Timeline Player Component Tests

The updated suite must verify:

1. The timeline header, transport, status, piano, play, restart, and tempo controls still render.
2. `falling-notes-stage` is absent.
3. `timeline-note-lane` is absent when the wrapper is removed.
4. A single active target highlights the corresponding white or black piano key.
5. A chord target highlights all required keys simultaneously.
6. Non-target keys remain idle.
7. Stop-and-wait mode highlights the current target key before input.
8. Assisted recovery highlights the recovery target key.
9. Advancing to the next event updates the highlighted key.
10. Completion clears target highlighting.
11. Existing keyboard and pointer input tests continue to pass.
12. Existing scoring, count-in, pause, tempo, recovery, stop-and-wait, hold, release, persistence, and completion tests continue to pass.

### 9.2 Course Piano Regression Tests

Keep the existing tests that verify:

- target styling for white and black keys;
- simultaneous target notes;
- active and wrong priority;
- pointer input;
- pointer release;
- fit-to-container behavior;
- auto-scroll behavior where covered.

### 9.3 Removed Tests

Delete dedicated falling-note renderer, layout, and geometry tests only after their production modules are deleted.

### 9.4 Repository-Wide Reference Check

The implementation must verify there are no remaining references to:

```text
FallingNotesStage
falling-notes-stage
falling-note
timeline-note-lane
timeline-viewport
fallingNotesLayout
fallingNotesTypes
usePianoKeyGeometry
PianoKeyGeometry
FallingNoteLayout
```

Any remaining reference must be reviewed and either removed, updated, or explicitly retained with a documented reason.

## 10. Accessibility Requirements

- `CoursePiano` remains exposed as `aria-label="Virtual piano"`.
- Each key retains its note, tone, and computer-keyboard shortcut label.
- Status updates remain in the existing polite live region.
- Hold progress retains its progressbar semantics.
- Removing the stage must also remove its `aria-label="Falling notes"`; no hidden empty region should replace it.
- Keyboard and pointer interaction must remain available.
- Reduced-motion users must not lose any required information because the remaining key highlight is static state, not motion-dependent.

## 11. Performance Requirements

The change should reduce client work by removing:

- one animation-frame loop used for visual beat updates;
- one stage `ResizeObserver`;
- piano/stage geometry measurement;
- piano-scroll geometry recomputation;
- falling-note layout calculation;
- falling-note DOM nodes and particle animations.

No new interval, animation frame, observer, global listener, or server request should be introduced as a replacement.

## 12. Risks and Mitigations

### Risk: Removing `LOOK_AHEAD_BEATS` Changes Runtime Timing

**Mitigation:** Relocate the value before deleting `fallingNotesLayout.ts`; add or preserve tests around recovery and stop-and-wait advancement.

### Risk: Mobile Landscape Retains an Empty Five-Rem Row

**Mitigation:** Update the explicit workspace grid rows and verify 740x390 and 1024x768 layouts.

### Risk: Target Guidance Becomes Less Obvious Without Falling Notes

**Mitigation:** Preserve the existing high-contrast target state, note labels, shortcut labels, auto-scroll, and status text. Styling redesign is outside this change.

### Risk: Chord Guidance Regresses

**Mitigation:** Add a timeline-player integration test asserting every note in the active chord is highlighted simultaneously.

### Risk: CSS Cleanup Removes General Timeline Rules

**Mitigation:** Delete selectors by responsibility rather than deleting the entire enhancement stylesheet.

### Risk: Falling-Note Utility Is Used Elsewhere

**Mitigation:** Run a repository-wide reference search before deleting each module.

## 13. Acceptance Criteria

The feature is accepted when all of the following are true:

- No falling-note stage, bar, strike line, particle, or key-column glow appears in normal timeline lessons.
- No empty falling-note lane or fixed-height placeholder remains.
- The current target note is indicated directly on `CoursePiano`.
- Every note in a target chord is indicated simultaneously.
- Target indication follows the existing stop-and-wait, recovery, and next-unjudged-event precedence.
- Target indication advances when the active event advances.
- Target indication clears at completion.
- Piano active and wrong feedback still override target styling.
- Horizontal target auto-scroll still works.
- Mobile landscape remains fully usable.
- The four-beat recovery and stop-and-wait lead-in behavior remains unchanged.
- Playback, tempo, scoring, recovery, stop-and-wait, persistence, completion, replay, and navigation remain unchanged.
- Falling-note-only modules, tests, selectors, and animations are removed after reference verification.
- Client tests pass.
- Client type checking passes.
- Client production build passes.
- Repository-wide tests, type checking, and build pass before release.

## 14. Out of Scope

- Redesigning key colors or animation.
- Adding sheet music, notation, tablature, or an upcoming-note queue.
- Changing lesson timing or note content.
- Changing scoring or timing windows.
- Changing stop-and-wait or assisted recovery rules.
- Changing tempo behavior.
- Changing course progression or persistence.
- Changing freestyle mode.
- Removing the legacy development player.
- Backend or database changes.
- Seed-course updates.

## 15. Definition of Done

The work is complete when the timeline lesson UI uses only `CoursePiano` target-key highlighting for note suggestions, all falling-note implementation artifacts are safely removed, runtime behavior remains equivalent, responsive layouts contain no obsolete stage space, and all required validation passes.