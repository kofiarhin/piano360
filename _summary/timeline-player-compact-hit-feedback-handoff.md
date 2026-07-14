# Piano360 Timeline Player Compact UI and Correct-Hit Feedback Handoff

## Status

Implemented and audited on `main`.

Current audited head at the time of this handoff:

- `b5c765417df48eb6f8527e13996dc418e5a0ff08` — `fix: harden compact timeline feedback hooks`

## Original Goal

Improve the Piano360 guided lesson player so the interface is more compact, the falling-notes playfield receives substantially more vertical space, and successful note hits feel more realistic and responsive.

The target UX was:

- keep the piano keyboard comfortable to use;
- reduce vertical padding, margins, and gaps in non-playfield UI;
- compact playback controls, progress, tempo, status, and score metrics;
- dedicate the recovered space to a taller falling-notes stage;
- optimize primarily for desktop while preserving tablet, mobile portrait, and the existing mobile-landscape experience;
- add subtle, fast success feedback when the learner hits the correct note.

## Authoritative Requirements

### Specification

`docs/specs/timeline-player-compact-hit-feedback.md`

### Implementation Plan

`_plan/timeline-player-compact-hit-feedback-implementation-plan.md`

The specification is the source of truth for behavior and acceptance criteria. The implementation plan describes the intended file-level and phased execution sequence.

## Architecture Confirmed During Inspection

### Route and player selection

`apps/client/src/features/courses/LessonPlayer.tsx`

- resolves lesson route data;
- preserves loading, locked, blocked, and unavailable states;
- routes playable guided lessons through `resolveGuidedTimeline(...)` into `TimelinePlayer`;
- retains the development-only legacy player path.

### Timeline orchestration

`apps/client/src/features/courses/timeline/TimelinePlayer.tsx`

- owns transport state;
- owns tempo state;
- computes progress;
- owns timeline judging state;
- dispatches event results into the guided-play reducer;
- computes the next target event;
- passes scored result classifications into `FallingNotesStage`;
- passes target notes into `CoursePiano`;
- persists completion progress.

### Falling-note rendering

`apps/client/src/features/courses/timeline/FallingNotesStage.tsx`

- measures the stage with `ResizeObserver`;
- updates visual beat position with `requestAnimationFrame` while transport is active;
- uses `layoutFallingNotes(...)` to position timeline events against measured piano-key geometry;
- receives persistent result classifications;
- already supports reduced-motion detection.

This was identified as the lowest-risk surface for success feedback because it already has event identity, result state, note geometry, and stage dimensions.

### Piano rendering

`apps/client/src/features/courses/CoursePiano.tsx`

- renders the interactive white and black keys;
- exposes note elements through `data-note-id`;
- supports target, active, correct, and wrong visual states;
- supports responsive and mobile-landscape sizing;
- provides the DOM geometry used by the falling-note layout pipeline.

### Geometry bridge

`apps/client/src/features/courses/timeline/usePianoKeyGeometry.ts`

The existing measured geometry remains the single coordinate system for falling notes and visual alignment. No second coordinate system was introduced.

## What Was Implemented

### 1. Detailed feature specification

Created:

`docs/specs/timeline-player-compact-hit-feedback.md`

The spec defines:

- scope and non-scope;
- desktop-first layout goals;
- responsive behavior;
- successful result classifications;
- note snap/fade behavior;
- impact glow and deterministic particles;
- matching key-column glow;
- reduced-motion requirements;
- performance expectations;
- accessibility requirements;
- testing requirements;
- acceptance criteria;
- known risks and mitigations.

### 2. Detailed implementation plan

Created:

`_plan/timeline-player-compact-hit-feedback-implementation-plan.md`

The plan includes:

- current architecture;
- exact affected files;
- phased implementation sequence;
- TDD-first test strategy;
- desktop density strategy;
- playfield expansion strategy;
- success animation design;
- mobile and reduced-motion handling;
- validation commands;
- QA matrix;
- recommended commit sequence;
- definition of done.

### 3. Compact timeline-player styling

Created:

`apps/client/src/timeline-player-enhancements.css`

Imported after existing styles from:

`apps/client/src/main.tsx`

The feature stylesheet isolates:

- timeline-player density overrides;
- desktop playfield expansion;
- hit animations;
- strike glow;
- deterministic particle effects;
- projected key-column glow;
- reduced-motion rules;
- mobile-landscape compatibility adjustments.

### 4. Successful falling-note hit feedback

Updated:

`apps/client/src/features/courses/timeline/FallingNotesStage.tsx`

Successful visual classifications:

- `perfect`;
- `good`;
- `early`;
- `late`.

These do not trigger the full success effect:

- `partial`;
- `missed`;
- `wrong`;
- `target`;
- `upcoming`.

On successful results, the implementation now:

1. resolves the falling note visually to the strike line;
2. marks the note with `data-hit="true"`;
3. applies a one-shot success animation class;
4. renders a restrained impact glow;
5. renders six deterministic particles;
6. projects a short-lived glow into the matching piano-key column;
7. fades the resolved note quickly;
8. keeps all decorative effects `aria-hidden` and pointer-transparent.

The `stageHeight` dependency was also included in the note-layout memo path so falling-note geometry recalculates when the stage resizes.

### 5. Stronger layout hooks

Codex hardened the implementation by replacing brittle DOM-order-dependent CSS targeting with explicit feature classes in `TimelinePlayer.tsx`:

- `.timeline-player-header`;
- `.timeline-transport`;
- `.timeline-progress-track`;
- `.timeline-status`;
- `.timeline-player-note-lane`;
- `.timeline-player-piano`;
- `.timeline-player-completion`.

This makes future DOM reordering less likely to silently break the compact layout.

### 6. Mobile-landscape compatibility

Codex added explicit compatibility handling so the desktop playfield expansion does not override the existing constrained mobile-landscape shell.

The falling-notes stage also carries the `timeline-viewport` hook expected by the existing responsive layout rules.

### 7. Test coverage

Updated:

`apps/client/src/features/courses/timeline/FallingNotesStage.test.tsx`

Coverage now verifies:

- target-note rendering still works;
- judged result rendering still works;
- all four successful classifications trigger the success contract;
- `data-hit="true"` is applied;
- the hit animation class is applied;
- impact feedback renders;
- six deterministic particles render;
- matching key-column glow renders with the expected measured geometry;
- non-success states do not receive the full success effect.

Updated:

`apps/client/src/features/courses/timeline/TimelinePlayer.test.tsx`

Coverage now verifies that compact-layout hooks are present without removing key controls such as:

- Play;
- Restart;
- Practice Tempo.

## Important Implementation Constraints Preserved

The work intentionally did not change:

- timing windows;
- timing classifications;
- scoring values;
- combo rules;
- completion eligibility;
- audio behavior;
- MIDI behavior;
- keyboard input semantics;
- on-screen piano input semantics;
- lesson schemas;
- course content;
- progression logic;
- route behavior;
- the legacy debug player path.

The animation layer consumes judged result state and does not influence gameplay authority.

## Relevant Commit History

Feature and supporting commits created during this work:

- `0f10b5924c1b8dbb23a15e61a0919fcd82ebb7aa` — `docs: specify compact timeline player hit feedback`
- `ccead9e585b5565e84e2260b5f802778a8173ae4` — `feat: compact timeline player and add hit feedback styles`
- `63764c45b5a5c7b7f4904d83f17666d48c5a39b5` — `feat: load timeline player enhancement styles`
- `c55ec472cdeb5eb60fb28fddecfc74a50e905661` — `feat: animate successful falling note hits`
- `c1d01a30dd80331b2c0983eee85ad87c4490826f` — `test: cover successful falling note hit feedback`
- `e1fb61139f3dfd3936a76f01d1599fe132e21c8a` — `docs: add full timeline player implementation plan`
- `b5c765417df48eb6f8527e13996dc418e5a0ff08` — `fix: harden compact timeline feedback hooks`

An unrelated documentation commit also exists in the history:

- `96f065d4c093218ced3f8abb663a0305819d25fe` — `docs: add repository contributor guidelines`

It is not part of the timeline-player feature itself.

## Audit Verdict

Overall assessment after auditing `main`:

- Code quality: 8.5/10
- Spec alignment: 9/10
- Regression safety: 8.5/10
- Architecture: 9/10
- Ready to keep on `main`: Yes

Verdict:

**Approve with minor follow-up.**

No critical or high-severity architectural defects were found.

Strengths:

- explicit, stable layout hooks;
- good separation between gameplay and presentation;
- all successful classifications covered;
- deterministic effects;
- geometry reuse instead of duplicated coordinate systems;
- mobile-landscape safeguards;
- focused regression tests;
- successful Vercel deployment status observed for the audited head.

## Remaining Work to Reach 10/10

### Priority 1 — Real piano-key illumination

The projected key-column glow is useful, but the original target experience is stronger if the actual matching `CoursePiano` key also briefly enters a success state.

Recommended direction:

- derive transient successful note ids from the latest judged successful event;
- pass those notes into `CoursePiano` through its existing `correctNotes` support;
- keep the success state brief, approximately 250–350 ms;
- ensure chords light multiple keys simultaneously;
- do not let the visual state influence scoring or input.

### Priority 2 — Prevent animation replay on unrelated rerenders

Verify that persistent result state does not cause the success burst to replay when unrelated state changes occur, including:

- tempo changes;
- viewport resize;
- score updates;
- chord updates;
- parent rerenders.

Ideal behavior:

`result becomes successful -> animation plays once -> effect finishes -> unrelated rerenders do not replay it`

If needed, add a small event-transition tracker keyed by `eventId`.

### Priority 3 — Add one Playwright regression test

Add a browser-level happy-path test that:

1. opens a playable lesson;
2. verifies the falling-notes stage and piano are both visible;
3. verifies the desktop stage meets a sensible minimum height;
4. starts playback;
5. triggers a correct note input;
6. confirms success feedback appears;
7. confirms the piano remains interactive.

### Priority 4 — Make the exact geometry assertion less brittle

One component test currently checks an exact transform value:

`translate3d(0, 160px, 0)`

This is valid for the current fixture, but it couples the component test to fallback stage dimensions and note geometry.

Recommended cleanup:

- keep exact geometry math in `fallingNotesLayout` tests;
- keep `FallingNotesStage` tests focused on behavioral contracts such as hit state, effect presence, and geometry alignment inputs.

### Priority 5 — Complete browser QA matrix

Manually verify at least:

- 1920x1080;
- 1440x900;
- 1366x768;
- 1024x768;
- 768x1024;
- mobile landscape.

Interaction scenarios:

- single correct note;
- rapid repeated notes;
- two-note chord;
- larger chord;
- early hit;
- late hit;
- wrong note;
- missed note;
- restart during animation;
- final hit immediately followed by lesson completion.

### Priority 6 — Full validation suite

Run from the repository root:

```bash
npm test -w @piano360/client
npm run typecheck -w @piano360/client
npm run build -w @piano360/client
npm run test:browser
npm run lint
```

The audited GitHub head had a successful Vercel status, but this handoff does not claim that all of the above local validation commands were observed running successfully.

## Recommended Next Action

Use the existing spec and implementation plan as the authority for any follow-up work:

- Spec: `docs/specs/timeline-player-compact-hit-feedback.md`
- Plan: `_plan/timeline-player-compact-hit-feedback-implementation-plan.md`

For the final production-polish pass, prioritize:

1. actual `CoursePiano` key illumination on successful hits;
2. one-shot animation replay safety;
3. Playwright coverage;
4. viewport and interaction QA;
5. full validation suite.

Once those are complete and green, the feature can reasonably be considered 10/10 production-ready.
