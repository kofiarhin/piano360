# Unified Falling-Notes Curriculum Specification

## Objective

Make every seeded Piano360 course and lesson playable through the same timeline-based falling-notes experience.

The curriculum must teach the interaction model before asking the learner to apply it to songs. Foundational material therefore becomes onboarding for the same mechanics used later in melody, chord, reggae, ska, dub, Gospel, hymn, spiritual, and approved limited-excerpt practice.

No seeded production lesson should surface as `migration-blocked` or `Coming soon` after the catalog is normalized and persisted.

## Core learning model

Every playable lesson uses a timeline and the existing falling-notes player.

The learner progresses through the same skills across the catalog:

1. Recognize the target key from the falling-note lane.
2. Press the target at the correct onset time.
3. Hold the key for the represented duration.
4. Release before the next distinct repeated-note target when required.
5. Move between neighboring and non-neighboring notes.
6. Play grouped notes simultaneously for chord targets.
7. Transfer those mechanics into phrases and complete musical passages.

## Catalog rules

### Universal rules

- Every lesson returned by the course repository must be `mode: "timeline"`.
- Existing valid timeline lessons remain timeline lessons.
- Existing verified timelines must preserve their verified note order, starts, durations, BPM, and provenance unless a known data defect is corrected from the course's own verified complete timeline.
- Legacy `migration-blocked` lessons must be converted from their retained `legacySteps` into playable timeline lessons.
- The normalized catalog must pass the existing `courseSchema`.
- No new state-management system is introduced.
- Existing course progression, completion, scoring, and `piano360.progress.v1` persistence remain authoritative.

### Foundational curriculum

Foundational lessons use the same falling-notes player as songs and deliberately teach duration and timing.

Instructional timelines should expose a progressive duration vocabulary:

- short target: 0.5 beat
- standard target: 1 beat
- medium hold: 1.5 beats
- long hold: 2 beats

Durations should recur in a predictable cycle so learners repeatedly experience short, standard, medium, and long holds.

Foundational lesson behavior remains forgiving:

- guided mode by default
- pause on miss
- generous timing profile
- no requirement to enable performance mode

Chord steps remain a single timeline event containing multiple notes. The falling-notes player therefore receives simultaneous targets without flattening the chord into separate sequential notes.

### Song and melody curriculum

Existing song/melody note material is authoritative.

When a lesson lacks reviewed or verified timing but retains legacy note steps:

- convert the steps into a playable instructional song timeline;
- preserve the exact event and note order;
- preserve simultaneous note groups;
- retain the original lesson slug, title, description, order, and final-lesson status;
- classify non-final lessons as `song-phrase`;
- classify final lessons as `complete-song`;
- use the standard timing profile;
- allow guided and performance modes;
- enable timing scoring.

Generated instructional song timing is an application practice arrangement, not a claim of exact original-song rhythm.

### Limited commercial excerpts

Courses labeled as limited or approved excerpts must remain limited to the note material already stored in the repository.

The conversion must not:

- add notes;
- append missing song sections;
- infer a full transcription;
- merge material from unrelated courses.

### Original Piano360 material

Original studies may be converted to the same instructional timeline model when verified timing is not already present.

## Timing model for migrated lessons

### Foundational timelines

Use sequential falling-note targets with a 0.5-beat visual gap after each event.

Cycle durations by event index:

`0.5 -> 1 -> 1.5 -> 2 -> repeat`

Recalculate event starts from the accumulated previous event duration plus the fixed gap. This ensures note length is visually and mechanically meaningful.

### Migrated song timelines

Use a compact practice rhythm that keeps the learner moving while still exposing duration variation.

Cycle durations by event index:

`0.5 -> 0.75 -> 1 -> 1.5 -> repeat`

Use a 0.25-beat gap between events.

The goal is a playable practice arrangement using the existing note material, not a fabricated claim of exact source-song rhythm.

## Ode to Joy integrity rule

Ode to Joy already has a verified complete timeline.

Phrase lessons must collectively reconstruct the complete verified event sequence. If a derived phrase boundary omits the final verified event, normalization should derive the answer phrase through `completeTimeline.events.length` rather than using a fragile hard-coded exclusive end index.

The complete verified lesson remains the source of truth.

## Persistence strategy

Catalog normalization is applied at the course repository boundary:

- `replaceAll`: normalize before validating and persisting;
- `findAll`: normalize legacy database documents before returning them;
- `findBySlug`: normalize legacy database documents before returning them.

This provides two guarantees:

1. Reseeding stores the unified timeline catalog in MongoDB.
2. Existing databases stop surfacing `Coming soon` immediately at read time, even before a reseed.

A reseed is still required to make the persisted database itself canonical.

## Acceptance criteria

### Catalog

- Every seeded course normalizes successfully.
- Every normalized lesson has `mode: "timeline"`.
- No normalized lesson has `mode: "migration-blocked"`.
- Every normalized course passes `courseSchema`.

### Foundations

- Foundation note events expose multiple durations including short and long holds.
- Chord targets preserve multiple notes in one event.
- Event starts are ordered and non-overlapping.

### Songs

- Existing note order is preserved when blocked lessons are converted.
- Existing simultaneous note groups are preserved.
- Final lessons remain final lessons.
- Limited excerpts gain no additional note material.

### Ode to Joy

- The two phrase lessons together contain the same note sequence as the complete verified lesson.
- The final verified note is not omitted by an exclusive slice boundary.

### Application behavior

- Course pages no longer show `Coming soon` for seeded lessons returned by the API.
- Lesson routes open through the existing timeline/falling-notes player.
- Existing progression and local progress behavior remain unchanged.

## Validation

Run from the repository root:

```bash
npm test
npm run typecheck
npm run build
```

Then persist the normalized catalog:

```bash
npm run seed:courses
```

Restart development services and manually verify representative foundation, chord, original-song, Gospel, and limited-excerpt courses.
