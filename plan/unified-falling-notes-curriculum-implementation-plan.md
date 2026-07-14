# Unified Falling-Notes Curriculum Implementation Plan

## Objective

Transform the entire Piano360 seeded curriculum into one consistent falling-notes learning system so every course and lesson is playable through the existing timeline player. Foundational material should teach the mechanics the learner needs for later songs: key location, onset timing, note duration, release timing, repeated notes, movement between notes, and simultaneous chord presses.

No currently seeded lesson should remain `migration-blocked` or surface as `Coming soon` after normalization.

## Product Outcome

A learner should experience one continuous interaction model from the first foundational exercise through complete songs and limited excerpts:

1. See a falling target.
2. Identify the correct key or keys.
3. Press at the correct time.
4. Hold for the intended duration.
5. Release appropriately.
6. Continue through repeated notes, movement patterns, chords, phrases, and complete pieces.

The curriculum should progressively increase complexity without changing the core interaction model.

---

## Scope

### In Scope

- Every seeded foundational course.
- Every seeded chord course.
- Every seeded reggae course.
- Every seeded Gospel/traditional melody course.
- Every original Piano360 study.
- Every commercial course already labeled as a limited excerpt.
- The timeline normalization layer.
- Falling-note timing and duration authoring.
- Simultaneous multi-note chord targets.
- Course progression and completion compatibility.
- Local progress persistence compatibility.
- Automated validation and regression tests.
- Database reseeding after implementation.

### Out of Scope

- Expanding limited commercial excerpts into fuller transcriptions.
- Adding new copyrighted note material.
- Replacing the existing timeline/falling-notes player.
- Redesigning the course UI.
- Moving learner progress from local storage to MongoDB.
- Adding unrelated courses.
- Rewriting unrelated application architecture.

---

## Existing Architecture to Preserve

The implementation should continue using the existing repository model:

- `Course -> Lesson -> Timeline`
- `TimelineLesson`
- `SongTimeline`
- `TimedNoteEvent`
- `LessonBehaviour`
- existing course validation
- existing lesson routes
- existing falling-notes player
- existing progression and unlock logic
- existing local progress persistence

The current repository already contains:

- canonical timeline lesson types;
- instructional timeline conversion for foundational content;
- song timeline support;
- a migration-blocked content state;
- manual/verified source metadata;
- local course progress;
- tests around course validation and timeline behavior.

The implementation should extend and normalize this architecture rather than introduce a second content system.

---

# Phase 1: Establish the Unified Playability Contract

## Goal

Define one invariant for seeded runtime content:

> Every seeded lesson returned by the repository is a valid `timeline` lesson.

## Tasks

1. Add a reusable course normalization layer.
2. Normalize all seeded and persisted course data before it reaches the client.
3. Preserve existing timeline lessons unchanged unless a known repair is required.
4. Convert guided-step lessons into timeline lessons.
5. Convert migration-blocked lessons that retain `legacySteps` into timeline lessons.
6. Keep the migration-blocked type available for future authoring safety if useful, but do not expose it for current seeded content.

## Acceptance Criteria

- `findAll()` returns only timeline lessons for seeded courses.
- `findBySlug()` returns only timeline lessons for seeded courses.
- `replaceAll()` persists normalized courses.
- No currently seeded lesson returned by the API is `migration-blocked`.
- No seeded course page renders `Coming soon` because of migration state.

---

# Phase 2: Foundation Curriculum as Falling-Notes Training

## Goal

Turn foundational courses into onboarding for the exact gameplay mechanics used later in songs.

## Learning Progression

### 2.1 Key Placement

Teach the learner to:

- locate C4, D4, E4, F4, G4;
- recognize repeated targets;
- move between adjacent notes;
- return to anchor notes from memory.

### 2.2 Timing

Teach the learner to:

- press when the falling note reaches the strike line;
- distinguish early, correct, and late input;
- respond to repeated timed targets.

### 2.3 Duration

Introduce progressive note lengths:

- short: `0.5` beat;
- standard: `1` beat;
- medium hold: `1.5` beats;
- long hold: `2` beats.

The exact sequence should intentionally vary so the learner must read the falling-note length instead of assuming every target is identical.

### 2.4 Repeated Notes

Repeated notes must remain separate timeline events.

The learner should have to:

- press;
- release;
- press again;

rather than holding continuously across multiple repeated targets.

### 2.5 Movement

Exercises should progress from:

- repeated anchor notes;
- adjacent steps;
- alternating notes;
- small jumps;
- mixed recall.

### 2.6 Chords

Chord targets should use one `TimedNoteEvent` containing multiple simultaneous notes.

Examples:

```ts
{
  type: "note",
  notes: ["C4", "E4", "G4"],
  startBeat: 8,
  durationBeats: 1.5
}
```

The player should treat this as one simultaneous falling target group.

## Acceptance Criteria

- Foundational lessons are timeline lessons.
- Foundational timelines contain intentionally varied durations.
- Chord lessons contain simultaneous multi-note events.
- Existing chord note sets remain unchanged.
- Final foundational lessons feel like transfer exercises into song practice.

---

# Phase 3: Convert All Existing Songs and Melody Studies

## Goal

Make every existing song and melody course playable through the falling-notes player.

## Content Rules

### Existing Note Sequences

Treat the existing stored note sequences as the authoritative content boundary unless a clear data error exists.

Do not reorder notes.

Do not silently replace existing material.

### Limited Commercial Excerpts

For courses labeled `Limited Excerpt`:

- preserve the exact existing phrase note lists;
- do not add notes;
- do not extend the passage;
- final lessons may only concatenate the existing phrase material.

### Original Piano360 Studies

Original studies may receive authored manual timing while preserving their note sequences.

### Traditional/Public-Domain Material

Use reviewed manual timing where verified timing is unavailable.

### Existing Verified Timelines

Preserve existing verified timeline data as the source of truth.

Do not replace verified event timing with generic generated timing.

---

# Phase 4: Timing Strategy

## Goal

Produce valid, playable timelines without fabricating unsupported full-song transcriptions.

## Timing Categories

### 4.1 Verified Timeline

Use unchanged where available.

Example:

- Ode to Joy complete verified timeline.

### 4.2 Reviewed Manual Timing

Use for existing note sequences that do not have verified timing.

Required metadata:

- `schemaVersion: 2`
- `timingSource: "verified"` only when the repository's schema and review convention use that value for approved manual timing;
- BPM;
- time signature;
- count-in;
- total beats;
- unique event IDs;
- reviewed source metadata.

### 4.3 Instructional Timing

Use for foundational drills where the objective is teaching mechanics rather than reproducing a song rhythm.

Instructional timelines should use generous timing windows and clear spacing.

## Timing Design Principles

- Repeated notes remain distinct events.
- Every event has positive duration.
- Events are ordered by `startBeat`.
- `totalBeats` reaches at least the final event end.
- Combined lessons correctly offset later phrase events.
- Event IDs are stable and unique.
- Phrase timing should not overlap unintentionally.

---

# Phase 5: Final Lesson Construction

## Goal

Ensure the final lesson of each course represents the complete existing course exercise.

## Rules

For phrase-based courses:

1. Build each phrase timeline independently.
2. Preserve phrase-relative timing.
3. Offset each later phrase by the preceding phrase duration.
4. Generate unique final-lesson event IDs.
5. Concatenate only existing phrase material.
6. Calculate `totalBeats` from the actual final event end.

For foundational courses:

- preserve the existing final exercise intent;
- use the falling-notes player;
- include timing and duration complexity that reflects earlier lessons.

For chord courses:

- preserve simultaneous chord events.

---

# Phase 6: Ode to Joy Integrity Repair

## Goal

Ensure all Ode to Joy lessons derive from the complete verified timeline without dropping the final event.

## Required Behavior

The phrase lessons, when concatenated in note order, must reconstruct the complete verified Ode to Joy note sequence.

Avoid fragile hard-coded exclusive end indices.

Preferred pattern:

```ts
const answerTimeline = deriveOdeTimelineSegment(
  splitIndex,
  odeToJoyTimeline.events.length,
  "ode-answer-phrase"
);
```

## Acceptance Criteria

- The complete lesson remains unchanged.
- Phrase lessons derive only from complete verified events.
- Phrase notes concatenate exactly to the complete timeline notes.
- No event from the verified source is dropped.

---

# Phase 7: Repository-Level Normalization

## Goal

Guarantee consistent behavior even when MongoDB contains older course records.

## Repository Integration

Normalize courses:

- when reading all courses;
- when reading a course by slug;
- before replacing/persisting all courses.

This allows:

- existing databases to serve playable timelines immediately through the API;
- reseeding to permanently write normalized records.

## Acceptance Criteria

- Old migration-blocked database records with retained legacy steps are normalized at read time.
- Reseeding stores normalized timeline lessons.
- Validation still runs before data is returned or persisted.

---

# Phase 8: Progression and Player Compatibility

## Goal

Preserve the existing learning flow while changing lesson content representation.

## Verify

- first lesson availability;
- sequential lesson unlocking;
- course completion counts;
- local progress persistence;
- refresh persistence;
- reset progress behavior;
- guided practice mode;
- performance mode where allowed;
- chord target handling;
- note-duration rendering;
- repeated-note input behavior.

## Do Not Change Unless Required

- progress storage architecture;
- routing;
- course completion semantics;
- unrelated client state management.

---

# Phase 9: Automated Test Coverage

## API / Course Data Tests

Add tests that verify:

1. Every seeded course normalizes successfully.
2. Every seeded lesson becomes `timeline`.
3. No normalized seeded lesson is `migration-blocked`.
4. All normalized courses pass `courseSchema` validation.
5. Event IDs are unique within each timeline.
6. Events are ordered by `startBeat`.
7. `totalBeats >= max(startBeat + durationBeats)`.
8. Repeated notes remain separate events.
9. Foundational lessons contain varied durations.
10. Chord exercises preserve simultaneous multi-note events.
11. Previously blocked songs preserve their exact note order.
12. Limited excerpts preserve their exact existing material boundaries.
13. Final lessons concatenate only existing phrase material.
14. Ode to Joy phrase lessons reconstruct the complete verified note sequence.

## Client Tests

Where useful, verify:

- normalized courses render the timeline player;
- `Coming soon` is not shown for seeded courses;
- falling-note lessons receive multi-note chord events correctly;
- progression remains compatible with lesson completion.

Avoid brittle visual snapshots unless already standard in the repository.

---

# Phase 10: Validation and Release

## Required Commands

Run from the repository root:

```bash
npm test
npm run typecheck
npm run build
```

Fix any failures before release.

## Database Publication

After validation:

```bash
npm run seed:courses
```

This replaces the course catalog in MongoDB with normalized timeline content.

## Local Verification

Start the app:

```bash
npm run dev
```

Manually verify at minimum:

- Finger Placement
- Beginner Chords
- Ode to Joy
- Three Little Birds Limited Excerpt
- Redemption Song Limited Excerpt
- Rivers of Babylon Limited Excerpt
- Island Sunrise
- at least one original reggae study
- at least one Gospel/traditional course

---

# Delivery Order

## Milestone 1 — Runtime Normalization

- Add course normalizer.
- Normalize guided-step and blocked content.
- Integrate with repository reads/writes.
- Ensure no seeded API response remains blocked.

## Milestone 2 — Foundation Mechanics

- Add intentional short/medium/long durations.
- Preserve key-placement exercises.
- Preserve simultaneous chords.
- Confirm player compatibility.

## Milestone 3 — Full Song Catalog

- Normalize all remaining songs.
- Preserve exact note sequences.
- Preserve limited excerpt boundaries.
- Preserve existing verified timelines.

## Milestone 4 — Regression Coverage

- Add universal playability tests.
- Add note-boundary tests.
- Add chord and duration tests.
- Add Ode integrity test.

## Milestone 5 — Validation and Seed

- Run tests.
- Run typecheck.
- Run build.
- Seed MongoDB.
- Perform manual smoke test.

---

# Definition of Done

The work is complete when:

- every seeded lesson is playable with falling notes;
- no seeded lesson surfaces as `Coming soon`;
- no seeded lesson remains `migration-blocked` at runtime;
- foundations teach timing and duration mechanics used later in songs;
- chord targets fall and validate as simultaneous note groups;
- all existing song note sequences are preserved;
- limited excerpts are not expanded;
- final lessons combine only existing phrase material;
- Ode to Joy retains its verified timeline integrity;
- course progression and local progress continue working;
- tests pass;
- typecheck passes;
- build passes;
- the database is reseeded with the normalized catalog.

---

# Current Main-Branch Implementation Mapping

The current implementation on `main` already establishes the core architecture for this plan:

- `docs/unified-falling-notes-curriculum-spec.md`
  - product and curriculum specification.

- `apps/api/src/courses/normalizePlayableCourse.ts`
  - runtime normalization of guided-step and migration-blocked lessons into timeline lessons;
  - foundational duration variation;
  - simultaneous chord preservation;
  - Ode to Joy phrase repair.

- `apps/api/src/courses/courseRepository.ts`
  - normalization on reads and writes.

- `apps/api/test/normalizePlayableCourse.test.ts`
  - regression coverage for universal timeline normalization, duration variation, chord grouping, note preservation, and Ode integrity.

The next required execution step after pulling `main` is repository validation followed by course reseeding:

```bash
npm test
npm run typecheck
npm run build
npm run seed:courses
```
