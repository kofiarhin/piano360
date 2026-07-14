# Timeline Player Compact Layout and Correct-Hit Feedback Implementation Plan

## 1. Implementation Goal

Implement the full compact guided-lesson experience described in `docs/specs/timeline-player-compact-hit-feedback.md` directly on `main`.

The finished experience must:

- reduce non-essential vertical chrome in the guided timeline player;
- dedicate substantially more viewport height to the falling-notes stage;
- preserve a comfortable, fully interactive piano;
- add immediate, subtle correct-hit feedback;
- keep timing, scoring, audio, MIDI, lesson data, and progression behavior unchanged;
- remain responsive across desktop, tablet, mobile portrait, and the existing mobile-landscape shell;
- remain accessible and respect reduced-motion preferences;
- include focused automated coverage and pass typecheck/build validation.

---

## 2. Current Codebase Architecture

### 2.1 Route and player selection

`apps/client/src/features/courses/LessonPlayer.tsx`

Responsibilities relevant to this work:

- resolves lesson route data;
- preserves loading, locked, blocked, and unavailable states;
- uses `resolveGuidedTimeline(...)` for playable timeline lessons;
- renders `TimelinePlayer` for the normal guided-play path;
- retains a legacy debug path behind `?legacyPlayer=1` in development.

Implementation constraint:

- do not alter routing semantics or legacy-player behavior unless required for compatibility;
- all visual work should target the normal `TimelinePlayer` path.

### 2.2 Timeline orchestration

`apps/client/src/features/courses/timeline/TimelinePlayer.tsx`

Current responsibilities:

- owns transport state and controls;
- owns tempo state;
- calculates lesson progress;
- owns timeline judging state;
- dispatches score/result events into `guidedPlayReducer`;
- computes the current target event;
- passes judged result classifications into `FallingNotesStage`;
- passes target notes into `CoursePiano`;
- saves completion progress.

This is the primary composition surface for layout compaction.

### 2.3 Falling-note rendering

`apps/client/src/features/courses/timeline/FallingNotesStage.tsx`

Current responsibilities:

- measures the stage height with `ResizeObserver`;
- animates the visual beat with `requestAnimationFrame` while transport is running;
- calls `layoutFallingNotes(...)` to map timeline events onto key geometry;
- renders note bars and the strike line;
- derives note visual state from persistent event results and the active target event;
- already has reduced-motion detection.

This is the correct surface for one-shot success visuals because it already receives:

- note layout geometry;
- note/event identity;
- final result classifications;
- the current stage dimensions.

### 2.4 Piano rendering

`apps/client/src/features/courses/CoursePiano.tsx`

Current responsibilities:

- renders white and black piano keys;
- exposes key elements via `data-note-id`;
- supports target, active, correct, and wrong visual states;
- supports responsive and mobile-landscape sizing;
- supports auto-scroll;
- provides the DOM geometry consumed by `usePianoKeyGeometry(...)`.

Implementation constraint:

- do not rewrite the piano or its input model;
- keep the standard desktop piano interaction size;
- use existing measured geometry for visual alignment.

### 2.5 Geometry bridge

`apps/client/src/features/courses/timeline/usePianoKeyGeometry.ts`

Role:

- measures piano key lanes relative to the falling-notes stage;
- provides `left`, `width`, and center positioning used by note layout.

Implementation constraint:

- avoid introducing a second coordinate system;
- all strike and key-column effects should derive from this existing geometry path.

### 2.6 Styling

`apps/client/src/styles.css`

Current responsibilities:

- global theme and root behavior;
- mobile landscape shell behavior;
- timeline-player mobile-landscape grid and density overrides;
- shared responsive behavior.

A dedicated feature stylesheet is preferable for desktop compaction and hit animation isolation:

`apps/client/src/timeline-player-enhancements.css`

Import order:

1. `styles.css`
2. `piano-highlight.css`
3. `timeline-player-enhancements.css`

The enhancement stylesheet should load last so scoped selectors can override default layout without rewriting global styles.

---

## 3. Implementation Principles

1. **Preserve gameplay authority**
   - The timing judge remains the only source of hit classification.
   - The reducer remains the only source of score/combo state.
   - Visual effects must consume result state, not influence it.

2. **Prefer CSS-driven one-shot effects**
   - Keep animation state minimal.
   - Do not create a per-frame particle simulation.
   - Use deterministic DOM particles and keyframes.

3. **Use existing geometry**
   - Align falling notes, strike effects, and key-column feedback from the same measured geometry.

4. **Compact chrome before shrinking the piano**
   - Recover vertical space from header, title, controls, metrics, and gaps first.

5. **Desktop-first, responsive by containment**
   - Desktop gets the most aggressive density improvements.
   - Tablet/mobile retain wrapping and scrolling behavior.
   - Existing mobile-landscape rules remain authoritative at small constrained viewports.

6. **No new dependency unless unavoidable**
   - Existing React/CSS tooling is sufficient.
   - Framer Motion is installed but not required for this implementation.

---

## 4. Implementation Sequence

## Phase 1 — Baseline Verification and Test Harness

### Files

- `apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx`
- optionally `apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx` if an existing suitable harness exists

### Steps

1. Confirm existing `FallingNotesStage` tests still assert:
   - strike line rendering;
   - note lane positioning;
   - target state;
   - judged result state.

2. Add failing tests before implementation for:
   - successful result marks a falling note as a hit;
   - successful result renders an impact container;
   - successful result renders the projected key/lane glow;
   - `partial` does not render the full success effect;
   - `missed` does not render the full success effect;
   - `wrong` does not render the full success effect.

3. Use deterministic selectors:
   - `data-hit="true"`;
   - `data-testid="timeline-hit-impact"`;
   - `data-testid="timeline-key-hit-glow"`.

4. Do not test animation timing with fake timers unless a JavaScript cleanup mechanism is later introduced.

### Exit criteria

- tests describe the desired success/non-success rendering contract;
- no gameplay logic tests need modification.

---

## Phase 2 — Compact Timeline Player Structure

### Primary file

`apps/client/src/features/courses/timeline/TimelinePlayer.tsx`

### Goal

Make the layout structurally easier to compact without changing behavior.

### Steps

1. Add stable, feature-specific class names to the major regions if they are not already present:
   - `.timeline-player-workspace`;
   - `.timeline-player-header` or existing nav wrapper;
   - `.timeline-transport`;
   - `.timeline-status`;
   - `.timeline-player-note-lane`;
   - `.timeline-player-piano`.

2. Preserve all existing controls and labels:
   - Play/Pause/Resume;
   - Restart;
   - beat progress;
   - tempo control;
   - timing source label;
   - feedback status;
   - Score;
   - Combo;
   - Rhythm;
   - completion actions.

3. Keep the component tree behaviorally identical.

4. Ensure the note lane remains a stacked composition:
   - falling-notes stage;
   - piano directly beneath it.

5. Avoid absolute positioning for top-level controls so responsive wrapping still works.

### Exit criteria

- DOM semantics and gameplay behavior are unchanged;
- the layout has reliable selectors for feature-specific CSS.

---

## Phase 3 — Desktop Density and Playfield Expansion

### Primary file

`apps/client/src/timeline-player-enhancements.css`

### Goal

Recover vertical space from non-playfield chrome and allocate it to the falling-notes stage.

### Desktop target (`min-width: 1024px`)

1. Compact the site header only within `.timeline-player-page`:
   - reduce internal vertical padding;
   - reduce unnecessary gaps;
   - keep minimum touch target behavior reasonable.

2. Compact `.timeline-player-workspace`:
   - reduce top/bottom padding;
   - reduce grid gap;
   - retain horizontal breathing room.

3. Compact title/navigation row:
   - reduce title top margin;
   - slightly tighten title line-height and size if needed;
   - keep course/title readability.

4. Compact transport row:
   - keep Play/Pause and Restart visible;
   - reduce button min-heights from large touch-oriented sizing to desktop-appropriate values;
   - keep beat text inline;
   - reduce progress-bar thickness;
   - keep tempo control aligned on the same row at wide widths.

5. Compact status and metrics:
   - keep feedback readable;
   - reduce minimum height;
   - tighten spacing between Score, Combo, Rhythm;
   - preserve semantic distinction and color coding.

6. Expand `.timeline-falling-notes-stage`:
   - target approximately `clamp(300px, 48dvh, 560px)` for typical desktop use;
   - tune final values against actual piano height and viewport behavior;
   - ensure short laptop viewports can still scroll rather than clipping content.

7. Keep the standard piano size.

8. Avoid forcing the entire page to exactly one viewport if that creates clipping.
   - prefer `min-height` and natural document flow;
   - allow shorter viewports to scroll.

### Tablet target

1. Allow transport/tempo wrapping.
2. Use a moderate stage height.
3. Preserve horizontal containment.
4. Do not apply desktop-only single-row assumptions.

### Mobile portrait

1. Keep natural vertical flow.
2. Avoid oversized stage height that pushes controls offscreen.
3. Preserve horizontal piano behavior.

### Mobile landscape

1. Existing selectors in `styles.css` remain authoritative.
2. Scope desktop enhancement rules so they do not override constrained landscape grid rows.
3. Ensure hit overlays do not affect flex sizing.

### Exit criteria

- typical desktop viewports show a visibly taller note stage;
- top chrome is substantially denser;
- piano remains comfortable;
- small layouts remain usable.

---

## Phase 4 — Successful Note Resolution

### Primary file

`apps/client/src/features/courses/timeline/FallingNotesStage.tsx`

### Success classifications

Treat these as successful visual outcomes:

- `perfect`;
- `good`;
- `early`;
- `late`.

Do not trigger full success feedback for:

- `partial`;
- `missed`;
- `wrong`;
- `target`;
- `upcoming`.

### Steps

1. Add a shared success classifier:

```ts
const successfulResultStates = new Set<TimingClassification>([
  "perfect",
  "good",
  "early",
  "late"
]);
```

2. For each note layout:
   - read `results[layout.eventId]`;
   - derive `successfulHit`;
   - preserve the existing semantic `state`.

3. Resolve successful notes to the strike line:
   - calculate the note's final Y position as `stageHeight - layout.height`;
   - use that only after the event has a successful result;
   - preserve normal `layout.translateY` before success.

4. Add stable attributes/classes:
   - `data-hit="true"` for successful notes;
   - `.timeline-falling-note--hit`.

5. Keep the note's result color from `noteStateClass`.

6. Ensure `stageHeight` is included in the `useMemo` dependency list used for `layoutFallingNotes(...)` so geometry recomputes after resizing.

### Motion target

- snap/settle: ~90–140 ms;
- bright impact: immediate;
- fade: ~180–280 ms;
- total note feedback: under ~500 ms.

### Exit criteria

- successful notes visually settle at the strike line;
- note fade is fast and subtle;
- non-success classifications do not use success animation.

---

## Phase 5 — Strike Glow and Deterministic Particle Burst

### Files

- `apps/client/src/features/courses/timeline/FallingNotesStage.tsx`
- `apps/client/src/timeline-player-enhancements.css`

### DOM structure

For each successful note, render an impact container positioned at the note/key center:

- `aria-hidden="true"`;
- `pointer-events: none`;
- `data-testid="timeline-hit-impact"`.

Inside it, render a fixed number of particles, recommended: 6.

### Determinism

Do not call `Math.random()`.

Use fixed nth-child transforms/directions in CSS so:

- animation remains visually varied;
- tests remain stable;
- server/client output is deterministic.

### Visual design

1. Impact glow:
   - small amber/gold radial pulse;
   - aligned to the strike line;
   - restrained opacity.

2. Particles:
   - small dots or short flecks;
   - low count;
   - outward travel of a few pixels to a few dozen pixels;
   - fast fade.

3. Do not add:
   - screen shake;
   - text popups;
   - confetti;
   - persistent particles.

### Exit criteria

- correct hits produce a clear but subtle impact cue;
- rapid notes and chords do not create excessive visual clutter;
- decorative elements do not participate in hit testing.

---

## Phase 6 — Matching Key-Column Feedback

### Files

- `apps/client/src/features/courses/timeline/FallingNotesStage.tsx`
- `apps/client/src/timeline-player-enhancements.css`

### Goal

Visually connect the strike event to the corresponding piano key without modifying `CoursePiano` input or scoring state.

### Steps

1. Reuse each layout's `left` and `width` from measured piano geometry.

2. Render a decorative overlay for successful notes:
   - `aria-hidden="true"`;
   - `pointer-events: none`;
   - `data-testid="timeline-key-hit-glow"`.

3. Position the overlay so it projects below the strike line into the top section of the piano lane.

4. Use a short gradient/glow rather than a solid block.

5. Keep the overlay independent from actual key button state.

6. Confirm the overlay cannot intercept:
   - pointer presses;
   - scrolling;
   - piano auto-scroll.

### Optional refinement after baseline implementation

If the projected overlay does not feel sufficiently connected to the physical key, add a short-lived `correctNotes` transient in `TimelinePlayer` and pass it into `CoursePiano`.

Only do this if needed after visual testing because it introduces additional transient state. The preferred baseline is geometry-based visual projection with no gameplay-state changes.

### Exit criteria

- successful note feedback clearly maps to the correct key lane;
- piano input remains unaffected.

---

## Phase 7 — Reduced Motion

### Files

- `FallingNotesStage.tsx`
- `timeline-player-enhancements.css`

### Existing behavior to preserve

`FallingNotesStage` already disables requestAnimationFrame beat interpolation when reduced motion is active.

### Additions

Under `@media (prefers-reduced-motion: reduce)`:

1. Disable hit-note transition/animation.
2. Hide particles.
3. Remove or greatly simplify impact pulse.
4. Remove animated key-column projection.
5. Preserve visible result-state color so successful feedback remains understandable.

### Exit criteria

- no unnecessary motion for reduced-motion users;
- result state remains visually clear.

---

## Phase 8 — Completion-State Layout Review

### Primary file

`TimelinePlayer.tsx`

### Goal

Ensure the completion section does not undo the compact layout or cause severe layout jumps.

### Steps

1. Keep the completion block in normal flow.
2. Tighten its spacing only if needed.
3. Preserve:
   - replay;
   - next lesson / return to course;
   - score summary;
   - duration;
   - max combo.

4. Ensure the note lane/piano remains visually stable when completion appears.

### Exit criteria

- completion remains readable;
- no broken overflow or control overlap.

---

## Phase 9 — Automated Test Completion

### `FallingNotesStage.test.tsx`

Required coverage:

1. renders strike line;
2. renders correct lane geometry;
3. renders target state;
4. renders judged state;
5. successful result sets `data-hit="true"`;
6. successful result renders impact feedback;
7. successful result renders key-column glow;
8. `partial` does not render full success feedback;
9. `missed` does not render full success feedback;
10. `wrong` does not render full success feedback.

### Potential layout/component tests

Add only where practical and stable.

Potential assertions:

- required timeline player class hooks are present;
- controls remain available;
- note lane still contains both stage and piano.

Avoid tests that depend on exact CSS pixel values in JSDOM.

### Exit criteria

- behavior-critical rendering contracts are covered;
- tests remain deterministic.

---

## Phase 10 — Validation

Run from repository root:

```bash
npm test -w @piano360/client -- FallingNotesStage.test.tsx
npm run typecheck -w @piano360/client
npm run build -w @piano360/client
```

Then run the broader client test suite:

```bash
npm test -w @piano360/client
```

If repository-wide confidence is required:

```bash
npm run typecheck
npm test
npm run build
```

### Manual verification matrix

#### Desktop

- 1920×1080-class viewport;
- 1440×900-class laptop viewport;
- short-height desktop viewport.

Verify:

- denser header/control stack;
- taller falling-note stage;
- piano remains comfortable;
- no clipped controls;
- correct note feedback is subtle and readable.

#### Tablet

Verify:

- controls wrap without overlap;
- stage remains useful;
- no horizontal overflow.

#### Mobile portrait

Verify:

- content scrolls naturally;
- keyboard remains usable;
- no desktop-only forced row layout.

#### Mobile landscape

Verify:

- existing specialized shell still fits the viewport;
- stage/piano layout does not overflow;
- hit visuals do not block interaction.

#### Gameplay cases

Verify:

- perfect single note;
- good single note;
- early single note;
- late single note;
- partial chord;
- completed chord;
- wrong note;
- missed event;
- rapid repeated notes;
- simultaneous chord notes;
- restart while effects are visible;
- pause/resume;
- tempo change;
- lesson completion.

#### Accessibility

Verify:

- keyboard input still works;
- on-screen piano remains pointer-accessible;
- decorative effects are not announced;
- reduced-motion preference suppresses unnecessary animation.

---

## 5. File-by-File Change Map

### `apps/client/src/features/courses/timeline/TimelinePlayer.tsx`

Expected changes:

- add/normalize CSS hooks for compact layout;
- preserve behavior and state flow;
- optionally tighten completion markup classes.

Do not change:

- judge logic;
- transport behavior;
- score dispatch;
- persistence behavior;
- input semantics.

### `apps/client/src/features/courses/timeline/FallingNotesStage.tsx`

Expected changes:

- success classification helper;
- successful-hit detection;
- strike-line resolution positioning;
- success data/class markers;
- deterministic impact effect markup;
- key-column glow markup;
- `stageHeight` dependency correctness;
- reduced-motion-aware animation behavior.

### `apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx`

Expected changes:

- success rendering tests;
- non-success exclusion tests;
- deterministic effect-container assertions.

### `apps/client/src/timeline-player-enhancements.css`

Expected responsibilities:

- desktop timeline density;
- responsive stage sizing;
- falling-note success keyframes;
- impact glow;
- particle directions;
- key-column projection;
- reduced-motion overrides.

### `apps/client/src/main.tsx`

Expected change:

- import `./timeline-player-enhancements.css` after existing stylesheet imports.

### `apps/client/src/styles.css`

Expected change:

- ideally none;
- only adjust if a global/mobile-landscape rule must be fixed because scoped enhancement CSS cannot safely solve it.

### `apps/client/src/features/courses/CoursePiano.tsx`

Expected change:

- none for the baseline implementation.

Only modify if later manual verification proves that the geometry projection alone is insufficient and an explicit transient key visual state is necessary.

---

## 6. Suggested Commit Sequence on `main`

Because the user explicitly requested direct work on `main`, keep commits small and independently understandable.

1. `test: define successful falling note feedback behavior`
   - add failing/expanded component tests.

2. `refactor: add timeline player layout hooks`
   - class hooks only, no intended behavior change.

3. `feat: compact guided timeline player layout`
   - desktop density and responsive stage sizing.

4. `feat: animate successful falling note resolution`
   - snap, fade, impact, particles, key-column glow.

5. `fix: respect reduced motion for hit feedback`
   - reduced-motion polish if not included in the prior commit.

6. `test: cover success and non-success visual states`
   - finalize tests after implementation.

7. `chore: validate timeline player implementation`
   - only if validation requires small cleanup changes.

Do not create a feature branch or PR unless the user later requests one.

---

## 7. Acceptance Checklist

### Layout

- [ ] Desktop player chrome is visibly more compact.
- [ ] Falling-notes stage is substantially taller at common desktop sizes.
- [ ] Piano remains comfortable and fully interactive.
- [ ] Tablet layout wraps safely.
- [ ] Mobile portrait remains usable.
- [ ] Existing mobile-landscape shell remains intact.

### Correct-hit feedback

- [ ] `perfect` triggers success feedback.
- [ ] `good` triggers success feedback.
- [ ] `early` triggers success feedback.
- [ ] `late` triggers success feedback.
- [ ] Successful note resolves to strike line.
- [ ] Successful note brightens briefly.
- [ ] Successful note fades quickly.
- [ ] Impact glow appears.
- [ ] Deterministic particle burst appears.
- [ ] Matching key-column glow appears.
- [ ] `partial` does not trigger full success effect.
- [ ] `missed` does not trigger full success effect.
- [ ] `wrong` does not trigger full success effect.

### Behavior preservation

- [ ] Timing windows unchanged.
- [ ] Scoring values unchanged.
- [ ] Combo behavior unchanged.
- [ ] Audio behavior unchanged.
- [ ] MIDI/keyboard/on-screen input unchanged.
- [ ] Tempo control unchanged functionally.
- [ ] Completion persistence unchanged.
- [ ] Route/loading/locked/blocked states unchanged.

### Accessibility and performance

- [ ] Decorative effects use `aria-hidden` where appropriate.
- [ ] Effects use `pointer-events: none`.
- [ ] Reduced motion is respected.
- [ ] No runtime-random particles.
- [ ] No per-frame particle state.
- [ ] No new heavy dependency.

### Validation

- [ ] Focused FallingNotesStage tests pass.
- [ ] Client test suite passes.
- [ ] Client typecheck passes.
- [ ] Client build passes.
- [ ] Manual viewport matrix passes.

---

## 8. Rollback Strategy

The implementation is intentionally separable.

If visual feedback introduces regressions:

1. remove the enhancement stylesheet import;
2. revert success-effect markup from `FallingNotesStage`;
3. leave gameplay logic untouched.

If compact layout introduces regressions:

1. revert only `.timeline-player-*` density rules;
2. preserve hit-feedback logic and tests.

No database, API, lesson-schema, or persistence migration is involved.

---

## 9. Final Definition of Done

The work is complete when:

1. the timeline player is visibly more compact on desktop;
2. the falling-notes area receives the majority of recovered vertical space;
3. the piano remains comfortable and interactive;
4. successful judged notes resolve cleanly at the strike line;
5. the user receives a fast, subtle glow/particle/key-lane response;
6. unsuccessful states do not receive success celebration feedback;
7. responsive and mobile-landscape behavior remains usable;
8. reduced-motion behavior is correct;
9. tests, typecheck, and build pass;
10. implementation remains directly on `main` with no feature branch required.
