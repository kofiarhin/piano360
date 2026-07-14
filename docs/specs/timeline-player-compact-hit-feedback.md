# Timeline Player Compact Layout and Correct-Hit Feedback Specification

## Status

Approved for direct implementation on `main`.

## Objective

Improve the guided timeline lesson experience by making the desktop lesson player substantially more compact and using the recovered vertical space for the falling-notes playfield. Add immediate, polished visual feedback when a scored note event is successfully hit without changing timing, scoring, audio, MIDI, lesson data, or progression behavior.

## Current Architecture

The playable guided lesson route resolves through `LessonPlayer` into `TimelinePlayer`. `TimelinePlayer` owns transport, judging, score state, and the relationship between `FallingNotesStage` and `CoursePiano`. `FallingNotesStage` receives persistent event results and piano key geometry, making it the lowest-risk place to render success impact feedback without modifying the timing judge or score reducer.

Relevant surfaces:

- `apps/client/src/features/courses/LessonPlayer.tsx`
  - Routes playable guided lessons to `TimelinePlayer`.
- `apps/client/src/features/courses/timeline/TimelinePlayer.tsx`
  - Owns transport controls, status, score summary, note lane, and piano composition.
- `apps/client/src/features/courses/timeline/FallingNotesStage.tsx`
  - Positions notes from timeline beat data and piano-key geometry.
  - Receives final timing classifications by event id.
- `apps/client/src/features/courses/CoursePiano.tsx`
  - Renders the interactive piano and provides key geometry through the existing measurement hook.
- `apps/client/src/styles.css`
  - Contains global/mobile landscape rules.

## Scope

### In scope

1. Compact the timeline lesson page on desktop.
2. Reduce vertical footprint of:
   - site header within the timeline player;
   - lesson title/navigation row;
   - transport controls and progress bar;
   - tempo control;
   - status/feedback block;
   - score/combo/rhythm metrics;
   - gaps between major sections.
3. Increase the falling-notes stage height and allow it to consume the primary share of available viewport height.
4. Preserve a comfortable piano height.
5. Add success feedback for fully judged successful events:
   - `perfect`;
   - `good`;
   - `early`;
   - `late`.
6. On success:
   - visually resolve the note at the strike line;
   - flash a compact strike glow;
   - emit a small deterministic particle burst;
   - project a short-lived glow into the matching piano-key column;
   - fade the resolved falling note quickly.
7. Respect `prefers-reduced-motion`.
8. Preserve tablet/mobile usability and the existing mobile landscape shell.
9. Add focused component tests for the new success visual state.

### Out of scope

- Timing windows or timing classifications.
- Score values, combo rules, or completion eligibility.
- Audio engine behavior.
- MIDI/keyboard/on-screen input handling.
- Lesson schemas or course content.
- Replacing the existing piano component.
- Adding a particle or canvas dependency.
- Broad redesigns outside the guided timeline player.

## Functional Requirements

### FR-1: Desktop compact layout

At desktop widths, the timeline player must reduce non-playfield vertical chrome. The page should remain legible and preserve current controls, but controls should use denser spacing and smaller minimum heights where safe.

### FR-2: Playfield priority

The falling-notes stage must become the dominant flexible vertical region. Its desktop height should scale with viewport height while retaining sensible minimum and maximum bounds.

Target behavior:

- short desktop viewport: stage remains usable and page may scroll;
- typical laptop/desktop viewport: stage becomes noticeably taller than the current implementation;
- large viewport: stage growth is capped so the piano remains comfortably visible.

### FR-3: Piano comfort

The standard desktop piano must remain at its current interaction-friendly size. Layout compaction should come primarily from surrounding chrome and spacing rather than aggressively shrinking keys.

### FR-4: Successful note resolution

When an event result changes to `perfect`, `good`, `early`, or `late`, each rendered note in that event must enter a success visual state.

The note should:

1. resolve visually to the strike line;
2. brighten briefly;
3. fade to transparent over a short interval.

The persistent result may remain in application state; the visual effect itself must complete without requiring result removal.

### FR-5: Strike feedback

Each successful note must render a short impact effect centered on its measured key lane:

- one restrained glow pulse;
- a small set of lightweight particles;
- no continuous particle simulation;
- no random runtime values that could make tests flaky.

### FR-6: Matching key-column glow

A successful note must project a short-lived glow below the strike line into the matching piano-key column. The effect should visually reinforce the corresponding key without intercepting pointer input.

The glow is an overlay based on existing piano-key geometry; it does not change piano input state or scoring state.

### FR-7: Non-success states

- `partial` retains its existing visual classification and must not trigger the full success burst.
- `missed` and `wrong` must not trigger success feedback.
- upcoming and target notes retain their current semantic states.

### FR-8: Reduced motion

When `prefers-reduced-motion: reduce` is active:

- continuous requestAnimationFrame interpolation remains disabled as today;
- hit particles are hidden;
- note resolution occurs without animated movement/fade;
- key-column glow is reduced to a brief/static visual or removed.

## UX and Motion Specification

### Visual tone

The effect should feel like instrument feedback rather than an arcade explosion.

Use:

- warm amber/gold impact glow consistent with the current theme;
- emerald/lime result colors already used for successful classifications;
- low particle count;
- fast easing;
- no screen shake;
- no large text popups;
- no sound changes.

### Motion timing

Recommended ranges:

- note snap/settle: approximately 90–140 ms;
- impact pulse: approximately 220–320 ms;
- particle burst: approximately 300–450 ms;
- note fade: approximately 180–280 ms;
- projected key-column glow: approximately 280–420 ms.

Exact timings may be implemented in CSS as long as the total response feels immediate and remains below roughly half a second.

## Layout Specification

### Desktop (`min-width: 1024px`)

- Reduce timeline player header padding.
- Reduce workspace top/bottom padding and section gaps.
- Keep title readable but slightly smaller/tighter.
- Keep transport and tempo on a single dense row where available.
- Keep status and metrics compact.
- Increase note stage to a viewport-relative range around 42–52dvh, with bounded minimum/maximum values.
- Keep the piano at standard size.

### Tablet

- Allow transport/tempo and status/metrics to wrap naturally.
- Use a moderate playfield height.
- Avoid horizontal overflow.

### Mobile landscape

- Preserve existing specialized mobile landscape behavior.
- New desktop rules must not override the existing constrained landscape grid.
- Hit feedback overlays must remain pointer-transparent.

### Mobile portrait

- Preserve scrolling and responsive wrapping.
- Do not force the desktop single-row control layout.

## Technical Design

### Styling isolation

Add a dedicated stylesheet imported after existing global styles so the feature can be iterated without rewriting the existing global stylesheet.

Suggested file:

`apps/client/src/timeline-player-enhancements.css`

Responsibilities:

- timeline player density/layout overrides;
- falling-note success keyframes;
- impact glow and particle styling;
- key-column projection styling;
- reduced-motion overrides.

### FallingNotesStage structure

Use a two-layer stage:

1. outer stage:
   - preserves geometry measurement;
   - allows controlled overflow for the key-column success glow;
2. inner clipped viewport:
   - contains background, note bars, strike line, and particle burst;
   - clips normal falling-note content to stage bounds.

For each layout entry:

- derive the result state as today;
- derive `isSuccessfulResult` from the accepted success classifications;
- for success, position the note so its bottom resolves at the strike line;
- add success-specific classes/data attributes;
- render deterministic impact particles;
- render a matching lane/key-column glow outside the clipped viewport.

### Performance

- Keep requestAnimationFrame behavior unchanged for active transport.
- Use CSS keyframes for one-shot hit effects.
- Keep particle count fixed and low.
- Avoid per-frame particle state.
- Use `pointer-events: none` on all overlays.
- Retain ResizeObserver-based stage measurement.

## Accessibility

- Preserve the existing `aria-label="Falling notes"` region.
- Decorative hit effects must be `aria-hidden="true"`.
- Do not add announcements for particles or glow.
- Do not change keyboard navigation or input semantics.
- Respect reduced-motion preferences.

## Testing Requirements

Update `FallingNotesStage.test.tsx` to verify:

1. target note rendering remains intact;
2. result state rendering remains intact;
3. a successful result adds the success visual marker;
4. successful result renders impact feedback;
5. missed/wrong/partial states do not render the full success feedback.

Tests should assert semantic/data attributes and presence of deterministic effect containers rather than animation frame timing.

## Acceptance Criteria

1. The desktop player is visibly more compact than the current layout.
2. The falling-notes stage is substantially taller at common desktop viewport sizes.
3. The piano remains comfortable and fully interactive.
4. Successful note events visibly resolve at the strike line.
5. Successful note events produce a brief glow and small particle burst.
6. A matching key-column glow projects into the piano area without blocking input.
7. Successful notes fade quickly after impact.
8. Partial, missed, and wrong results do not trigger the success burst.
9. Reduced-motion users do not receive unnecessary animated particles/movement.
10. Existing timing, scoring, progress saving, input, and audio code paths remain unchanged.
11. Existing mobile landscape behavior remains usable.
12. Focused component tests cover the new success visual state.

## Risks and Mitigations

### Risk: stage overflow covers piano interaction

Mitigation: all projected effects use `pointer-events: none` and decorative overlays only.

### Risk: note layout becomes stale after stage height changes

Mitigation: include measured `stageHeight` in layout memo dependencies.

### Risk: persistent result state leaves a visible hit effect forever

Mitigation: CSS animations finish at transparent/hidden end states while result state may remain persistent.

### Risk: chords generate excessive particles

Mitigation: fixed low particle count per note and short animation duration.

### Risk: mobile landscape regressions

Mitigation: scope desktop density/height rules by media query and preserve the existing mobile landscape selectors.

## Validation

Run from repository root:

```bash
npm test -w @piano360/client -- FallingNotesStage.test.tsx
npm run typecheck -w @piano360/client
npm run build -w @piano360/client
```

Also manually verify:

- desktop lesson at a typical 1440p/1080p-class viewport;
- shorter laptop viewport;
- tablet width;
- mobile landscape shell;
- rapid single notes;
- chord events;
- reduced-motion preference.
