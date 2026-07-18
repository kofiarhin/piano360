# Guided Learning Mode Implementation Plan

**Status:** Ready for implementation  
**Depends on:** `docs/specs/guided-learning-mode.md`  
**Last updated:** 2026-07-18

## Objective

Implement the first complete pause-and-wait guided lesson flow in Piano360 while preserving the existing Course -> Lesson -> Step content model and local-only learner progress.

## Delivery Strategy

Use a vertical, test-first sequence. Establish deterministic domain behaviour first, integrate the existing piano input second, connect UI and persistence third, then validate one seeded lesson end to end before expanding content.

Avoid unrelated refactoring. Keep server-state logic outside components and keep session state local to the lesson player unless current architecture makes a shared store necessary.

## Phase 0: Repository and Data Audit

### Tasks

- Inspect the current lesson page, piano component, keyboard mapping, audio playback, progress storage, API lesson response, and seed schema.
- Identify the exact existing note representation and whether stable note-event identifiers already exist.
- Map current tests and reusable fixtures.
- Confirm how lesson completion currently unlocks subsequent lessons.
- Record any implementation conflict with the approved specification before changing code.

### Exit criteria

- Existing input and progress boundaries are identified.
- The first seeded lesson selected for guided mode is known.
- Required schema changes, if any, are explicit and minimal.

## Phase 1: Domain Types and Lesson Normalization

### Tests first

- Valid guided-note steps normalize into an ordered flat sequence.
- Duplicate note values remain separate events.
- Invalid note names, missing IDs, and empty playable sequences fail safely.
- Existing non-guided lesson steps remain supported.

### Implementation

- Add or extend shared client types for guided notes and lesson status.
- Create a pure lesson-to-guided-sequence normalizer.
- Add canonical note normalization using the project’s current naming convention.
- Add seed/API types only if the current payload lacks required fields.

### Exit criteria

- One lesson response can be converted into a deterministic guided sequence.
- Normalization has complete unit coverage for expected and malformed inputs.

## Phase 2: Guided Lesson Reducer / State Machine

### Tests first

Cover:

- loading -> ready
- ready -> countdown
- countdown -> waiting_for_input
- wrong input -> incorrect_feedback -> waiting_for_input
- correct input -> correct_feedback -> next note
- final correct input -> completed
- pause and resume from every active state
- restart from active and completed states
- ignored input during non-input states
- duplicate correct events advance once
- metric updates and retries
- error transitions

### Implementation

- Implement a pure reducer with typed events.
- Keep timers and browser APIs outside the reducer.
- Store `currentNoteIndex`, metrics, timestamps, previous status, and error state.
- Guard impossible transitions.

### Exit criteria

- The entire lesson progression can be simulated without React or browser APIs.
- Reducer tests cover all state transitions and edge cases.

## Phase 3: Input Adapter

### Tests first

- On-screen input emits normalized `PianoInput` events.
- Keyboard input emits the same event shape.
- Held keyboard keys do not create repeated accepted attempts.
- Inputs are ignored when the state machine is not waiting.
- Consecutive identical expected notes can each be completed by distinct presses.

### Implementation

- Extract or wrap current piano input handling behind a shared adapter.
- Normalize note names at the adapter boundary.
- Add keydown/keyup protection for repeat events.
- Preserve existing sound behaviour without coupling sound to correctness logic.

### Exit criteria

- Every supported input source follows one evaluation path.
- Input behaviour is covered by unit or interaction tests.

## Phase 4: Timing and Controller Hook

### Tests first

Use fake timers to cover:

- countdown completion
- correct and incorrect feedback delays
- pause freezing timers
- resume restoring safely
- restart clearing timers
- unmount and lesson changes clearing timers
- stale timer callbacks not advancing a replaced session

### Implementation

- Add a controller hook that coordinates reducer events and timers.
- Use refs or cancellation tokens to reject stale callbacks.
- Keep configurable delays in one module.
- Ensure browser audio restrictions do not block visual progression.

### Exit criteria

- No timer can advance a paused, restarted, unmounted, or replaced lesson.
- Timer behaviour is deterministic under fake timers.

## Phase 5: Guided Player UI

### Tests first

- Ready state displays a start action.
- Countdown is announced appropriately.
- Expected note and lesson position are visible.
- Wrong input displays accessible feedback and does not advance.
- Correct input advances after feedback.
- Pause, resume, restart, and exit controls work.
- Reduced-motion users do not receive required motion effects.

### Implementation

Build or adapt:

- `GuidedLessonPlayer`
- progress indicator
- expected-note display
- feedback region
- player controls
- completion summary
- error and retry state

Integrate with the existing piano component through props/events rather than embedding API or persistence logic in presentational components.

### Exit criteria

- The guided flow is usable with mouse/touch and keyboard.
- Focus remains stable across note transitions.
- Status is not communicated by colour alone.

## Phase 6: Local Progress Persistence

### Tests first

- Completion writes guided metrics to the existing progress object.
- Existing unrelated progress survives the write.
- Incomplete exit and refresh do not mark completion.
- Malformed or older progress data is handled safely.
- Storage write failure does not block lesson completion.
- Best accuracy updates only when improved.

### Implementation

- Extend the existing `piano360.progress.v1` adapter.
- Add defensive parsing/migration for new optional fields.
- Persist completion once per completed session.
- Connect completion to existing lesson unlock rules.

### Exit criteria

- Guided completion survives refresh locally.
- Existing progress behaviour has no regression.

## Phase 7: API and Seed Content

Only perform this phase if the audit confirms current data is insufficient.

### Tests first

- Guided lesson payload contains stable ordered note events.
- Invalid guided seed content is rejected.
- Existing lesson endpoints and non-guided courses remain valid.

### Implementation

- Extend the step schema minimally.
- Update Mongoose/API serialization if required.
- Add one guided lesson sequence to an appropriate beginner lesson.
- Keep seeding deliberate through `npm run seed:courses`.

### Exit criteria

- At least one seeded lesson supports Guided Learning Mode end to end.
- No existing course content is removed or silently reinterpreted.

## Phase 8: Lesson Page Integration

### Tests first

- A valid guided lesson exposes a Guided Learning Mode start path.
- Invalid or non-guided content uses existing behaviour.
- Loading and API errors produce recoverable UI.
- Navigation away cleans up timers and input listeners.
- Completion returns or links to the expected course progression.

### Implementation

- Connect lesson server data to the normalizer and player controller.
- Keep API fetching in the current data layer.
- Add entry UI consistent with the existing lesson design.
- Protect legacy lesson flows with feature/content detection.

### Exit criteria

- A learner can enter, complete, exit, restart, and revisit the guided lesson.
- Existing lesson routes remain functional.

## Phase 9: Accessibility and Responsive Validation

### Automated checks

- Accessible names for all controls and piano keys.
- Live-region updates for countdown and feedback.
- Keyboard-only completion path.
- No duplicate landmark or control-label regressions.

### Manual checks

- Small mobile viewport with piano scrolling.
- Desktop layout.
- Screen reader smoke test.
- Reduced motion.
- Touch target usability.
- Browser audio disabled or blocked.

### Exit criteria

- The feature is operable without a pointer.
- Expected, correct, and incorrect states remain understandable without colour or sound.

## Phase 10: Full Validation and Documentation

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also run the seed workflow against a safe development database when seed content changes:

```bash
npm run seed:courses
```

Update README documentation only where developer setup, content authoring, or guided-step schema has changed.

### Exit criteria

- All automated checks pass.
- One guided lesson passes the complete manual acceptance flow.
- No regressions are found in course listing, lesson loading, or existing progress.

## Suggested Commit Sequence

1. `test: define guided lesson normalization`
2. `feat: add guided lesson domain model`
3. `test: define guided lesson state transitions`
4. `feat: implement guided lesson reducer`
5. `test: cover normalized piano input`
6. `feat: add guided input adapter`
7. `test: cover guided player timing`
8. `feat: add guided player controller`
9. `feat: build guided lesson interface`
10. `test: cover guided progress persistence`
11. `feat: persist guided lesson completion`
12. `feat: add first guided lesson content`
13. `feat: integrate guided mode with lesson page`
14. `docs: document guided lesson authoring`

Commits may be combined where the repository’s preferred workflow requires it, but tests should land with or before the behaviour they define.

## Definition of Done

- All acceptance criteria in the specification pass.
- At least one seeded lesson is playable in Guided Learning Mode.
- Correct input advances exactly once; incorrect input never advances.
- Pause, resume, restart, exit, refresh, and completion behave safely.
- Completion updates existing local progress without data loss.
- Keyboard, touch, accessibility, and responsive checks pass.
- Lint, typecheck, tests, and production build pass.
- The Ideas Hub is updated with implementation status, decisions, links, remaining work, risks, and next action.

## Known Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Existing lesson data lacks stable note events | Add the smallest backward-compatible seed/schema extension after the audit |
| Held keys generate repeated input | Track keydown/keyup state and ignore `event.repeat` |
| Timer races advance stale sessions | Centralize timers and cancel them on every lifecycle transition |
| Local progress schema changes break old data | Use optional fields, defensive parsing, and migration tests |
| Identical consecutive notes are deduplicated accidentally | Identify events by stable IDs and advance by index |
| Mobile piano is too dense | Use a contained horizontal piano scroller and keep primary controls fixed |
| Audio cannot start automatically | Make progression and feedback independent of sound |

## Immediate Next Action

Begin Phase 0 and produce a concise implementation audit mapping the current lesson page, piano input, progress adapter, lesson schema, and first candidate guided lesson to the components described in the specification.