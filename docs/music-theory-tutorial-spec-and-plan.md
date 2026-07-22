# Music Theory Tutorial and Expanded Keyboard Specification

**Project:** Piano360  
**Repository:** `kofiarhin/piano360`  
**Document status:** Implementation-ready specification; code work requires explicit approval  
**Task status:** `needs_approval`  
**Created:** 2026-07-22  
**Target release:** Beginner Music Theory Foundations vertical slice, followed by the full course

## 1. Executive Summary

Piano360 currently provides a solid guided-practice foundation: courses contain ordered lessons, lessons contain note or chord targets, learners practise through guided or timeline playback, and completion is stored locally in the browser.

This specification extends that foundation into a complete teaching experience. The first structured curriculum will be **Music Theory Foundations**, based on the approved lesson-note sequence covering keyboard geography, note names, accidentals, scales, intervals, chords, rhythm, notation, and chord progressions.

The product flow will become:

```text
Prepare -> Learn -> Explore -> Practise -> Check -> Complete
```

The on-screen piano will expand from the current `A3-C5` range to `C2-C6`. Laptop input will continue to use the existing 16-key physical pattern, but it will control a movable 16-semitone window over the expanded piano. Learners will use `Z` and `X` to shift the window down or up by one octave when shifting is permitted. Lessons will automatically select and, during scored playback, lock an appropriate input window.

The implementation will preserve existing courses and song timelines. New tutorial capabilities will be optional additions to the current course model, and legacy content will continue to load through compatibility normalisation.

## 2. Background and Current System

### 2.1 Current architecture

Piano360 is an npm workspace containing:

- `apps/api`: Express, Mongoose, TypeScript, course APIs, validation, and seed content.
- `apps/client`: React, Vite, TypeScript, TanStack Query, Tone-based audio, lesson players, and local progress.
- `tests/browser`: Playwright browser-level flows.

Current course content follows:

```text
Course -> Lesson -> Step
```

Existing course endpoints are:

```http
GET /api/courses
GET /api/courses/:courseSlug
GET /api/courses/:courseSlug/lessons/:lessonSlug
```

Course content is deliberately published through the seed workflow. Learner progress is stored locally under `piano360.progress.v1`.

### 2.2 Current piano and input constraints

The current piano supports 16 chromatic pitches from `A3` to `C5`. Laptop input is hard-coded as:

| Physical key | Current pitch | Semitone offset |
| --- | ---: | ---: |
| `A` | A3 | 0 |
| `W` | A#3 | 1 |
| `S` | B3 | 2 |
| `D` | C4 | 3 |
| `E` | C#4 | 4 |
| `F` | D4 | 5 |
| `R` | D#4 | 6 |
| `G` | E4 | 7 |
| `H` | F4 | 8 |
| `Y` | F#4 | 9 |
| `J` | G4 | 10 |
| `U` | G#4 | 11 |
| `K` | A4 | 12 |
| `I` | A#4 | 13 |
| `L` | B4 | 14 |
| `;` | C5 | 15 |

The piano component already supports horizontal overflow, manual scrolling, target-note auto-centering, multiple visual states, pointer press/release handling, and responsive size variants. The expanded keyboard should build on those capabilities rather than introduce a separate piano implementation.

### 2.3 Current lesson constraints

Guided lesson steps currently support only:

- one target note; or
- one target chord.

There are no first-class data types for:

- explanations;
- formulas;
- diagrams;
- unscored exploration;
- multiple-choice questions;
- note naming;
- item ordering;
- enharmonic spelling;
- staff-reading questions;
- mastery thresholds; or
- stage-level progress.

The existing practice engine should remain responsible for note, chord, timing, hold, release, recovery, and completion behaviour. New tutorial stages will wrap that engine.

## 3. Product Goals

### 3.1 Primary goals

1. Teach beginner music-theory concepts through concise, interactive lessons.
2. Preserve hands-on piano input as the centre of the learning experience.
3. Expand the playable range enough for full scales, intervals, chords, and future left-hand work.
4. Preserve the learnable laptop-keyboard layout instead of assigning the entire laptop to many octaves.
5. Distinguish conceptual understanding from note-playing accuracy.
6. Track completion, mastery, and review needs.
7. Keep current courses and songs working throughout the migration.
8. Keep curriculum authoring reviewable in TypeScript seed content for the MVP.

### 3.2 Success indicators

The first release is successful when a beginner can:

- start the Music Theory Foundations course;
- complete an explanation and an interactive demonstration;
- explore the concept without being penalised;
- practise it with the existing guided engine;
- answer a checkpoint question;
- receive a mastery result;
- continue from saved local progress; and
- use an expanded `C2-C6` piano through a movable laptop-input window.

## 4. Non-Goals

The following are outside the initial scope:

- a full 88-key piano;
- MIDI hardware input;
- microphone or acoustic-piano recognition;
- user accounts or cloud progress;
- teacher dashboards;
- a curriculum CMS;
- AI-generated curriculum;
- advanced harmony or jazz theory;
- automatic fingering analysis;
- complete conversion of all existing courses to tutorials;
- multiplayer or social features; and
- native mobile applications.

## 5. Approved Product Decisions

1. Create one beginner course named **Music Theory Foundations**.
2. Organise it into five modules and fifteen lessons.
3. Use the standard lesson flow `Prepare -> Learn -> Explore -> Practise -> Check -> Complete`.
4. Expand the virtual piano to `C2-C6`.
5. Preserve the current 16-key laptop layout as a movable chromatic window.
6. Use `Z` for octave down and `X` for octave up.
7. Automatically choose the input window required by each lesson.
8. Lock octave shifting while scored guided or timeline playback is active.
9. Use `KeyboardEvent.code` for physical keyboard mapping.
10. Separate sounding pitch from displayed theoretical spelling.
11. Reuse existing guided-step and timeline engines inside the tutorial shell.
12. Add conceptual checkpoints and mastery tracking.
13. Keep content authored and validated through the existing seed workflow initially.
14. Build a three-lesson vertical slice before authoring the entire course.
15. Preserve existing courses through optional schema additions and compatibility adapters.

## 6. Target Learner Experience

### 6.1 Course-library flow

The course library displays:

```text
Music Theory Foundations
Learn the keyboard, scales, intervals, chords, rhythm, notation, and progressions.
Beginner / Mixed / 15 lessons
```

The card should show:

- lesson count;
- estimated total time;
- completion percentage;
- mastered lesson count;
- `Start course` for a new learner; and
- `Continue` for a returning learner.

### 6.2 Course-overview flow

The course overview groups lessons under module headings. Each lesson row shows:

- sequence number;
- title;
- short objective;
- estimated time;
- locked, available, completed, mastered, or needs-review status;
- best practice score;
- best checkpoint score; and
- `Start`, `Continue`, `Review`, or `Replay` action.

Unlocking remains beginner-friendly: completing required lesson stages unlocks the next lesson. Mastery is encouraged but is not required to continue.

### 6.3 Standard lesson flow

#### Prepare

The learner sees:

- lesson title;
- two to four objectives;
- estimated minutes;
- active piano range;
- laptop range;
- input instructions; and
- a start action.

#### Learn

The learner reads or watches a short series of structured content blocks. A block should communicate one idea and normally fit within one viewport.

#### Explore

The learner manipulates the concept without scoring. Wrong selections do not reduce accuracy, add retries, or block progress.

#### Practise

The learner enters the existing guided or timeline player. The lesson follows:

```text
Introduce -> Repeat -> Mix -> Challenge
```

#### Check

The learner completes a short conceptual checkpoint. A lesson may contain one checkpoint with multiple questions, or one generated activity scored over several prompts.

#### Complete

The learner receives:

- practice score;
- checkpoint score;
- rhythm score when applicable;
- retries;
- time spent;
- completion status;
- mastery status; and
- recommended next action.

## 7. Curriculum Specification

### 7.1 Module and lesson structure

#### Module 1: Keyboard Foundations

1. Keyboard Geography
2. Musical Alphabet
3. Landmark Notes: C and F
4. Sharps, Flats, and Enharmonic Notes

#### Module 2: Scales and Intervals

5. Half Steps and Whole Steps
6. The Major Scale Formula
7. The Natural Minor Scale Formula
8. Understanding Intervals

#### Module 3: Building Chords

9. Major and Minor Triads
10. Augmented and Diminished Triads
11. Correct Chord Spelling

#### Module 4: Rhythm and Reading

12. Note Values and Counting
13. Time Signatures
14. Reading the Grand Staff

#### Module 5: Musical Application

15. Chord Progressions and Final Mastery

### 7.2 Lesson requirements

| Lesson | Learn | Explore | Practise | Check | Suggested piano range |
| --- | --- | --- | --- | --- | --- |
| Keyboard Geography | Groups of two and three black keys | Toggle key groups and landmarks | Find C and F across octaves | Identify the landmark beside a highlighted key | C2-C6 |
| Musical Alphabet | A-G and wrap after G | Next/previous note explorer | Ascending, descending, and random notes | Ordering and next-note questions | C3-C5 |
| Landmark Notes | C before two, F before three | Toggle every C or F | Find C/F with decreasing help | Random landmark recall | C2-C6 |
| Sharps and Flats | Accidentals and enharmonic names | Select black keys and compare names | Play requested accidental pitches | Select valid names and exceptions | C3-C5 |
| Half/Whole Steps | One or two semitones | Choose root and movement | Move up/down from prompts | Play destination without highlight | C3-C5 |
| Major Scale | W-W-H-W-W-W-H | Build scale from chosen root | C, G, D, and F major | Complete scale and missing accidental | C3-C6 |
| Natural Minor Scale | W-H-W-W-H-W-W | Compare major and minor | A, E, D, and C natural minor | Build A minor and identify formula | C3-C6 |
| Intervals | Named intervals and semitone distance | Root/destination interval explorer | Build common intervals | Identify and play interval | C3-C6 |
| Major/Minor Triads | Major 4+3, minor 3+4 | Compare qualities from one root | Build and play common triads | Build requested chord | C3-C6 |
| Augmented/Diminished | Augmented 4+4, diminished 3+3 | Compare four triad qualities | Build altered triads | Identify/build quality | C3-C6 |
| Chord Spelling | Stacked thirds and letter spelling | Compare equivalent pitch sets | Play the chord | Select correct written spelling | C3-C6 |
| Note Values | Quarter, half, whole, eighth, dotted half | Hear and visualise durations | Tap/play short patterns | Perform rhythm pattern | C3-C5 |
| Time Signatures | Numerator and denominator; 4/4 and 3/4 | Change measures and beat grouping | Count and play measures | Identify beats per measure | C3-C5 |
| Grand Staff | Treble/bass lines and spaces | Staff note highlights piano key | Play displayed staff notes | Timed staff-reading set | C2-C6 |
| Progressions | Scale degrees and common progressions | Hear and inspect chord sequence | C-G-Am-F and Am-F-C-G | Mixed final assessment | C3-C6 |

### 7.3 Source and content policy

The curriculum may use the extracted tutorial notes as its factual sequence and learning outline, but application copy must be original Piano360 instructional content. Do not copy the source transcript verbatim. Each lesson should include internal source metadata for curriculum review without displaying unnecessary provenance to learners.

## 8. Expanded Piano Specification

### 8.1 Supported sounding range

The initial expanded range is:

```text
C2 through C6, inclusive
MIDI 36 through MIDI 84
49 chromatic pitches
29 white keys
20 black keys
```

Range constants belong in the shared domain package:

```ts
export const PIANO_MIN_MIDI = 36;
export const PIANO_MAX_MIDI = 84;
```

### 8.2 Sounding pitch model

A sounding pitch is identified by MIDI number:

```ts
export type MidiPitch = number;
```

Runtime validation must enforce:

- integer value;
- range `36-84` for the current virtual piano; and
- unique targets within a chord or event.

### 8.3 Display spelling model

Displayed theory spelling is separate from sounding pitch:

```ts
export type NoteLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type Accidental = "bb" | "b" | "natural" | "#" | "##";

export type NoteSpelling = {
  letter: NoteLetter;
  accidental: Accidental;
  octave: number;
};

export type PitchReference = {
  midi: MidiPitch;
  spelling?: NoteSpelling;
};
```

`C#4` and `Db4` therefore share the same `midi` value but retain different spellings.

### 8.4 Legacy-note compatibility

Existing course data uses sharp-based note strings. Introduce adapters:

```ts
legacyNoteIdToMidi(noteId: LegacyNoteId): MidiPitch
midiToCanonicalNoteId(midi: MidiPitch): string
formatPitch(reference: PitchReference, preference: SpellingPreference): string
```

Migration rules:

1. Existing seed content may be converted to MIDI during the shared-domain phase.
2. Database course content is resettable through the existing seed script, so no permanent MongoDB user data migration is required.
3. API normalisation must accept legacy note strings during the transition.
4. New tutorial content must use the new pitch representation.
5. Remove legacy parsing only after all seed content and tests use the new representation.

### 8.5 Generated piano-key definitions

Replace the fixed key array with generated definitions:

```ts
export type PianoKeyDefinition = {
  midi: MidiPitch;
  tone: "white" | "black";
  canonicalLabel: string;
};

export const buildPianoKeys = (
  minMidi = PIANO_MIN_MIDI,
  maxMidi = PIANO_MAX_MIDI
): PianoKeyDefinition[] => { /* generated */ };
```

Keyboard shortcut labels must not be stored as permanent properties of every piano key. They are derived from the current laptop window.

### 8.6 Laptop input window

The laptop controls 16 consecutive semitones.

```ts
export const LAPTOP_WINDOW_SIZE = 16;

export type LaptopWindow = {
  startMidi: MidiPitch;
  endMidi: MidiPitch;
  octaveShift: number;
};
```

The default start is MIDI 57 (`A3`), preserving current behaviour.

The window may start only where all 16 semitones fit within `C2-C6`:

```text
minimum start: C2 / MIDI 36
maximum start: A#4 / MIDI 70
```

Octave shifting adds or subtracts 12 semitones and clamps to valid window starts.

### 8.7 Physical-key layout

Use `KeyboardEvent.code`:

```ts
export const laptopKeyLayout = [
  { code: "KeyA", label: "A", semitoneOffset: 0 },
  { code: "KeyW", label: "W", semitoneOffset: 1 },
  { code: "KeyS", label: "S", semitoneOffset: 2 },
  { code: "KeyD", label: "D", semitoneOffset: 3 },
  { code: "KeyE", label: "E", semitoneOffset: 4 },
  { code: "KeyF", label: "F", semitoneOffset: 5 },
  { code: "KeyR", label: "R", semitoneOffset: 6 },
  { code: "KeyG", label: "G", semitoneOffset: 7 },
  { code: "KeyH", label: "H", semitoneOffset: 8 },
  { code: "KeyY", label: "Y", semitoneOffset: 9 },
  { code: "KeyJ", label: "J", semitoneOffset: 10 },
  { code: "KeyU", label: "U", semitoneOffset: 11 },
  { code: "KeyK", label: "K", semitoneOffset: 12 },
  { code: "KeyI", label: "I", semitoneOffset: 13 },
  { code: "KeyL", label: "L", semitoneOffset: 14 },
  { code: "Semicolon", label: ";", semitoneOffset: 15 }
] as const;
```

`Z` and `X` are reserved controls and must not generate notes:

```ts
const OCTAVE_DOWN_CODE = "KeyZ";
const OCTAVE_UP_CODE = "KeyX";
```

### 8.8 Input resolution

```ts
resolveLaptopPitch(code, windowStartMidi): MidiPitch | undefined
```

Resolution rules:

1. Ignore repeat keydown events.
2. Ignore events targeting editable controls.
3. Resolve by physical `code`.
4. Prevent default only for recognised piano or octave controls.
5. Track keydown and keyup by input source so chords and held notes work.
6. Clear held laptop sources on window blur, visibility loss, lesson restart, and octave change.
7. Do not allow an octave shift while any laptop note is held.

### 8.9 Window controls

Display a compact control near the piano:

```text
Laptop range A3-C5
[Z] Octave down    [X] Octave up
```

Control states:

- enabled in Freestyle Mode when the shifted range is valid;
- enabled before a lesson attempt begins when the lesson allows shifting;
- enabled while paused only when no notes are held and the lesson allows shifting;
- disabled during count-in, active playback, recovery, chord collection, or completion scoring;
- hidden or disabled when the lesson locks the window.

### 8.10 Lesson-selected range

```ts
export type LessonKeyboardConfig = {
  visibleMinMidi: MidiPitch;
  visibleMaxMidi: MidiPitch;
  preferredWindowStartMidi?: MidiPitch;
  allowOctaveShift: boolean;
  lockWindowDuringPractice: boolean;
  spellingPreference?: "sharp" | "flat" | "lesson";
};
```

Selection algorithm:

1. Gather every target pitch required by the practice activity.
2. Honour a valid `preferredWindowStartMidi` when it contains all required pitches.
3. Otherwise find the closest valid window containing all required pitches.
4. Prefer the window nearest the current or default start.
5. If no 16-semitone window contains the target set, mark the activity invalid during course validation.
6. Centre the visible piano on the target range when the lesson opens.

### 8.11 Piano visuals

A key may display:

- note label;
- laptop shortcut badge when inside the active window;
- target state;
- active state;
- correct state;
- wrong state;
- explore-selection state; and
- lesson-landmark or comparison state.

Shortcut badges appear only on mapped keys. Unmapped keys remain playable by pointer unless the lesson explicitly restricts pointer input.

### 8.12 Responsive behaviour

Desktop and tablet:

- horizontally scroll the four-octave keyboard;
- preserve minimum readable white-key width;
- auto-centre target notes;
- allow manual scroll and resume auto-centering after inactivity.

Mobile landscape:

- retain the compact lesson shell;
- show a suitable visible slice rather than shrinking all 29 white keys below usable width;
- keep target notes in view; and
- preserve pointer interaction.

### 8.13 Keyboard ghosting risk

Some laptops cannot register every three- or four-key combination. Requirements:

- test all chord combinations used by initial lessons;
- avoid laptop combinations known to fail on common keyboards when equivalent inversions are available;
- preserve on-screen pointer input as a fallback;
- show a help message when a learner repeatedly produces a partial chord; and
- document MIDI input as a future enhancement, not a current dependency.

## 9. Shared Domain Package

Create:

```text
packages/course-domain/
├── package.json
├── tsconfig.json
└── src/
    ├── pitch.ts
    ├── spelling.ts
    ├── keyboard.ts
    ├── courseTypes.ts
    ├── lessonContent.ts
    ├── checkpoints.ts
    ├── mastery.ts
    ├── validation.ts
    └── index.ts
```

Update root workspaces:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

The API and client must import shared course, lesson, pitch, keyboard, checkpoint, and mastery contracts from this package. Remove duplicated client/API domain declarations after compatibility tests pass.

## 10. Course and Lesson Data Model

### 10.1 Course modules

```ts
export type CourseModule = {
  id: string;
  title: string;
  description?: string;
  order: number;
};
```

Extend courses:

```ts
export type Course = {
  slug: string;
  title: string;
  description: string;
  contentType: ContentType;
  hand: "left" | "right" | "both";
  difficulty: Difficulty;
  order: number;
  estimatedMinutes?: number;
  modules?: CourseModule[];
  lessons: Lesson[];
};
```

Existing courses may omit modules. The Music Theory Foundations course uses `hand: "both"` to indicate that it is not restricted to one hand.

### 10.2 Lesson base

```ts
export type LessonBase = {
  slug: string;
  title: string;
  description: string;
  order: number;
  isFinal: boolean;
  contentKind?: LessonContentKind;
  moduleId?: string;
  estimatedMinutes?: number;
  tutorial?: TutorialLesson;
};
```

### 10.3 Tutorial definition

```ts
export type LessonStage =
  | "prepare"
  | "learn"
  | "explore"
  | "practice"
  | "checkpoint"
  | "complete";

export type TutorialLesson = {
  objectives: string[];
  keyboard?: LessonKeyboardConfig;
  learn: LessonContentBlock[];
  explore?: ExploreActivity[];
  checkpoint?: CheckpointDefinition;
  mastery?: MasteryRules;
  source?: CurriculumSourceMetadata;
};
```

### 10.4 Content blocks

Initial content-block union:

```ts
export type LessonContentBlock =
  | TextBlock
  | FormulaBlock
  | CalloutBlock
  | PianoDemoBlock
  | NoteTableBlock
  | ComparisonBlock
  | ChordDiagramBlock
  | IntervalDiagramBlock
  | AudioExampleBlock;
```

Later rhythm/staff phases add:

```ts
| RhythmNotationBlock
| StaffNotationBlock
```

Every block requires a stable `id`. Blocks must be serialisable, validated, and free from executable markup.

### 10.5 Explore activities

Initial explore types:

```ts
export type ExploreActivity =
  | KeyboardLandmarkExplorer
  | StepDistanceExplorer
  | ScaleBuilderExplorer
  | IntervalExplorer
  | ChordBuilderExplorer
  | EnharmonicExplorer;
```

Later phases add rhythm and staff explorers.

### 10.6 Checkpoints

Initial checkpoint types:

```ts
export type CheckpointQuestion =
  | MultipleChoiceQuestion
  | OrderItemsQuestion
  | PlayPitchQuestion
  | BuildIntervalQuestion
  | BuildChordQuestion
  | NamePitchQuestion
  | EnharmonicQuestion
  | ChordSpellingQuestion;
```

Later phases add:

```ts
| RhythmPerformanceQuestion
| StaffReadingQuestion
```

Checkpoint requirements:

- stable question IDs;
- explicit correct answer or evaluator configuration;
- learner-facing explanation for incorrect answers;
- deterministic scoring;
- optional randomisation only when seeded or reproducible in tests;
- best score persisted; and
- retry supported without replaying the entire lesson.

### 10.7 Practice data

Move practice targets from note-name strings toward MIDI pitches:

```ts
export type LessonStep = {
  id: string;
  type: "single-note" | "chord";
  instruction: string;
  targetPitches: MidiPitch[];
  displaySpellings?: NoteSpelling[];
};
```

Timeline note events use the same approach:

```ts
export type TimedNoteEvent = {
  id: string;
  type: "note";
  pitches: MidiPitch[];
  displaySpellings?: NoteSpelling[];
  startBeat: number;
  durationBeats: number;
  hand?: "left" | "right" | "both";
  velocity?: number;
  instruction?: string;
  fingerNumbers?: number[];
};
```

### 10.8 Validation rules

Validation must confirm:

- MIDI values are integers in supported bounds;
- target pitches are unique;
- spelling octaves and letters are valid;
- spelling resolves to the supplied MIDI pitch;
- module IDs are unique;
- lesson module references exist;
- lesson and module orders are unique within their scope;
- tutorial objectives are non-empty;
- content block IDs are unique per lesson;
- checkpoint question IDs are unique;
- mastery percentages are between `0` and `1`;
- lesson keyboard ranges are valid;
- every practice target fits the lesson visible range;
- every laptop-required target set fits a valid 16-note input window;
- existing timeline provenance rules remain enforced; and
- existing song content is not converted to instructional timing without approved provenance.

## 11. Tutorial Frontend Architecture

### 11.1 Route contract

Keep existing routes and add a stage query parameter:

```text
/courses/:courseSlug/lessons/:lessonSlug?stage=prepare
/courses/:courseSlug/lessons/:lessonSlug?stage=learn
/courses/:courseSlug/lessons/:lessonSlug?stage=explore
/courses/:courseSlug/lessons/:lessonSlug?stage=practice
/courses/:courseSlug/lessons/:lessonSlug?stage=checkpoint
/courses/:courseSlug/lessons/:lessonSlug?stage=complete
```

Rules:

- tutorial lessons default to the first unfinished required stage;
- existing non-tutorial lessons continue directly to practice;
- invalid stage values redirect to the resolved current stage;
- completed earlier stages remain revisit-able;
- required later stages cannot be opened before prerequisites are complete;
- browser back/forward navigation must restore the visible stage.

### 11.2 Component structure

```text
TutorialLessonPage
├── LessonHeader
├── LessonStageNavigation
├── PrepareStage
├── LearnStage
│   └── LessonContentRenderer
├── ExploreStage
│   └── ExploreActivityRenderer
├── PracticeStage
│   ├── TimelinePlayer
│   └── GuidedStepPlayer compatibility path
├── CheckpointStage
│   └── CheckpointRenderer
├── CompletionStage
├── LaptopRangeControl
└── ExpandedCoursePiano
```

### 11.3 Practice-engine integration

The current `LessonPlayer` becomes a router/wrapper:

1. Load course and lesson.
2. Resolve lock state.
3. If the lesson has no tutorial metadata, preserve current behaviour.
4. If the lesson has tutorial metadata, render `TutorialLessonPage`.
5. The practice stage resolves the current guided or authored timeline exactly as today.
6. Completion from the practice engine updates the tutorial progress store rather than immediately treating the whole lesson as complete.
7. The checkpoint stage follows when configured.

### 11.4 Accessibility

Requirements:

- every piano key has an accurate accessible label;
- shortcut labels indicate the active window only;
- stage navigation exposes current and completed states;
- checkpoint controls are keyboard-accessible without colliding with piano shortcuts;
- piano shortcuts are suspended while focus is inside interactive form controls;
- feedback uses `aria-live` without repeatedly announcing every decorative update;
- colour is never the only indicator of correct, wrong, target, or locked state;
- reduced-motion preferences disable non-essential movement; and
- horizontal piano scrolling remains operable by pointer, touch, trackpad, and keyboard.

## 12. Progress and Mastery

### 12.1 Storage version

Introduce:

```text
piano360.progress.v2
```

### 12.2 Progress shape

```ts
export type StageProgress = {
  completed: boolean;
  completedAt?: string;
};

export type TutorialLessonProgress = {
  courseSlug: string;
  lessonSlug: string;
  stages: Record<LessonStage, StageProgress>;
  practice: {
    attempts: number;
    bestAccuracy?: number;
    bestRhythmAccuracy?: number;
    bestScorePercent?: number;
    bestDurationMs?: number;
    bestMaxCombo?: number;
  };
  checkpoint: {
    attempts: number;
    bestScore?: number;
    bestScorePercent?: number;
    completedQuestionIds: string[];
  };
  mastery: {
    status:
      | "not-started"
      | "in-progress"
      | "completed"
      | "mastered"
      | "needs-review";
    masteredAt?: string;
  };
  lastOpenedStage: LessonStage;
  updatedAt: string;
};
```

### 12.3 Migration from v1

Migration rules:

1. Read v1 when v2 does not exist.
2. Preserve completed lesson slugs.
3. Preserve available practice statistics.
4. Mark migrated completed lessons as `completed`, not automatically `mastered`.
5. Mark tutorial stages `prepare`, `learn`, `explore`, and `checkpoint` incomplete unless evidence exists.
6. For existing non-tutorial lessons, treat the existing completion as full lesson completion.
7. Save a v2 snapshot only after successful migration.
8. Preserve the original v1 value until v2 save succeeds.
9. Reset only malformed records, with a clear learner-facing notice.

### 12.4 Mastery rules

```ts
export type MasteryRules = {
  minimumPracticeAccuracy?: number;
  minimumRhythmAccuracy?: number;
  minimumPracticeScorePercent?: number;
  minimumCheckpointScorePercent?: number;
};
```

Default beginner theory rules:

```ts
{
  minimumPracticeAccuracy: 0.8,
  minimumCheckpointScorePercent: 0.8
}
```

Status resolution:

- `not-started`: no stage has begun;
- `in-progress`: at least one stage has begun but required stages are incomplete;
- `completed`: required stages complete and no mastery rule exists;
- `mastered`: required stages complete and every configured threshold is met;
- `needs-review`: required stages complete but at least one threshold is not met.

Next-lesson unlocking is based on required-stage completion, not mastery.

## 13. API and Persistence

### 13.1 API compatibility

No new API endpoint is required for the first tutorial release. Existing course and lesson endpoints return enriched optional fields.

Course summaries may add:

```ts
moduleCount?: number;
estimatedMinutes?: number;
```

### 13.2 MongoDB schema

Extend Mongoose schemas for:

- `Course.modules`;
- `Course.estimatedMinutes`;
- `Course.hand = both`;
- lesson `moduleId`;
- lesson `estimatedMinutes`;
- lesson `tutorial`;
- MIDI practice targets;
- display spellings;
- content blocks;
- explore activities;
- checkpoints; and
- mastery rules.

Continue validating through Zod before inserting or returning course content.

### 13.3 Seed publishing

Continue using:

```bash
npm run seed:courses
```

The command remains deliberate and must not run during application startup or deployment.

## 14. Curriculum File Organisation

Refactor the large seed file into focused modules:

```text
apps/api/src/courses/content/
├── index.ts
├── existingFoundations/
├── songs/
└── musicTheoryFoundations/
    ├── index.ts
    ├── modules.ts
    ├── keyboardGeography.ts
    ├── musicalAlphabet.ts
    ├── landmarkNotes.ts
    ├── sharpsAndFlats.ts
    ├── halfAndWholeSteps.ts
    ├── majorScale.ts
    ├── naturalMinorScale.ts
    ├── intervals.ts
    ├── majorMinorTriads.ts
    ├── augmentedDiminishedTriads.ts
    ├── chordSpelling.ts
    ├── noteValues.ts
    ├── timeSignatures.ts
    ├── grandStaff.ts
    └── chordProgressions.ts
```

Each lesson file contains:

- metadata;
- objectives;
- keyboard configuration;
- learning blocks;
- explore activity;
- practice steps or timeline;
- checkpoint;
- mastery rules; and
- curriculum source metadata.

## 15. Detailed Implementation Plan

All implementation work below remains `needs_approval` until the user explicitly approves this specification for code changes.

### Phase 0: Specification baseline

**Outcome:** This document is the repository-local authority for the feature.

Tasks:

- Save this specification under `docs/`.
- Link future issues, branches, commits, and pull requests to this document.
- Record any accepted scope change in this document before implementation.

Verification:

- File exists on `main`.
- Markdown renders correctly.
- No application files changed.

### Phase 1: Shared pitch and keyboard domain

**Goal:** Introduce one source of truth for pitch, spelling, and laptop layout.

Expected files:

```text
package.json
packages/course-domain/**
apps/api/tsconfig.json
apps/client/tsconfig.json
```

Tasks:

1. Add `packages/*` to root workspaces.
2. Create `@piano360/course-domain`.
3. Add MIDI constants and validators.
4. Add note-spelling conversion and validation.
5. Add generated piano-key definitions for `C2-C6`.
6. Add physical laptop-key layout and input-window functions.
7. Add tests for conversion, range, clamping, enharmonic equality, and generated key counts.
8. Add legacy note-string adapters.

Acceptance criteria:

- Exactly 49 pitches are generated.
- Exactly 29 white and 20 black keys are generated.
- Every MIDI value maps to the expected canonical label.
- C# and Db references compare as one sounding pitch.
- Every laptop code resolves to the expected offset.
- Octave shifts clamp correctly.
- API and client can import the package.

### Phase 2: Expanded piano and input window

**Goal:** Render and play `C2-C6` while preserving the current laptop pattern.

Expected files:

```text
apps/client/src/features/courses/CoursePiano.tsx
apps/client/src/features/courses/courseKeyboard.ts
apps/client/src/features/courses/FreestyleMode.tsx
apps/client/src/features/courses/LessonPlayer.tsx
apps/client/src/features/courses/timeline/useTimelineInput.ts
apps/client/src/audio/**
apps/client/src/features/notes/**
```

Tasks:

1. Convert `CoursePiano` from fixed note definitions to generated keys.
2. Derive shortcut badges from the active window.
3. Update black-key positioning for 29 white keys.
4. Preserve existing scroll and auto-centering behaviour.
5. Introduce `useLaptopPianoInput` for shared keydown/keyup handling.
6. Resolve by `KeyboardEvent.code`.
7. Add window state and `Z`/`X` controls.
8. Clear held notes safely during shifts and blur.
9. Add window controls to Freestyle Mode.
10. Add lesson-controlled window locking hooks.
11. Update audio APIs to accept MIDI pitch or a normalised pitch object.
12. Update chord recognition to use pitch classes derived from MIDI.

Acceptance criteria:

- Pointer input plays every C2-C6 key.
- Laptop input preserves current default pitches.
- Z/X shift one octave.
- Invalid shifts are disabled.
- Shortcut badges move to the shifted keys.
- Held-note and chord behaviour remains correct.
- Existing Freestyle chord recognition still works.
- Existing guided and timeline lessons still work.

### Phase 3: Shared course schema and compatibility migration

**Goal:** Add tutorial, module, pitch, and mastery contracts without breaking existing content.

Expected files:

```text
packages/course-domain/src/courseTypes.ts
packages/course-domain/src/lessonContent.ts
packages/course-domain/src/checkpoints.ts
packages/course-domain/src/mastery.ts
packages/course-domain/src/validation.ts
apps/api/src/courses/courseSchema.ts
apps/api/src/courses/courseValidation.ts
apps/api/src/courses/normalizePlayableCourse.ts
apps/api/src/courses/seedCourses.ts
apps/client/src/features/courses/courseTypes.ts
```

Tasks:

1. Move shared types out of duplicated API/client files.
2. Add course modules and `hand: both`.
3. Add optional tutorial metadata.
4. Add content-block and explore unions.
5. Add initial checkpoint union.
6. Add mastery rules.
7. Convert guided and timeline targets to MIDI.
8. Add legacy content preprocessing.
9. Update Mongoose schemas.
10. Split seed content into focused files without changing existing course behaviour.
11. Update API tests and seeded-course snapshots/assertions.

Acceptance criteria:

- Existing seeded courses validate and load.
- Existing API responses remain usable by the updated client.
- Tutorial fields are optional.
- Invalid spelling/pitch pairs fail validation.
- Invalid laptop-unreachable target groups fail validation.
- Duplicate module, block, and question IDs fail validation.

### Phase 4: Tutorial shell and progress v2

**Goal:** Add stage navigation and persist stage-level learning progress.

Expected files:

```text
apps/client/src/features/courses/TutorialLessonPage.tsx
apps/client/src/features/courses/tutorial/**
apps/client/src/features/courses/LessonPlayer.tsx
apps/client/src/features/courses/CourseOverview.tsx
apps/client/src/features/courses/CourseCard.tsx
apps/client/src/features/courses/progressStorage.ts
```

Tasks:

1. Add stage resolver and query-param synchronisation.
2. Add Prepare stage.
3. Add Learn stage and content renderer.
4. Add Explore renderer framework.
5. Wrap existing practice players.
6. Add checkpoint renderer framework.
7. Add Completion stage.
8. Implement progress v2 and v1 migration.
9. Add module grouping to Course Overview.
10. Display completed, mastered, and needs-review statuses.
11. Resume at the last unfinished stage.

Acceptance criteria:

- Non-tutorial lessons preserve direct practice flow.
- Tutorial lessons progress in the correct order.
- Browser navigation preserves stage state.
- Reload resumes the correct stage.
- Completion does not occur before required practice/checkpoint stages.
- v1 completion data is preserved.

### Phase 5: Three-lesson vertical slice

**Goal:** Prove the complete architecture with three representative lessons.

#### Lesson A: Keyboard Geography

Validates:

- text and callout blocks;
- piano demonstration;
- landmark explorer;
- expanded-keyboard navigation;
- guided note practice; and
- multiple-choice/play-pitch checkpoint.

#### Lesson B: Half Steps and Whole Steps

Validates:

- pitch arithmetic;
- generated prompts;
- step-distance explorer;
- dynamic target creation; and
- play-pitch checkpoint.

#### Lesson C: Major and Minor Triads

Validates:

- formula and comparison blocks;
- chord builder;
- multi-note laptop input;
- chord ghosting guidance;
- guided chord practice; and
- build-chord checkpoint.

Tasks:

1. Author the three lessons.
2. Add the Music Theory Foundations course and initial modules.
3. Add deterministic checkpoint content.
4. Add mastery thresholds.
5. Add API, client, and browser tests for all three flows.
6. Conduct curriculum review for wording and theory accuracy.

Acceptance criteria:

- A new learner can complete all six stages of each lesson.
- Practice and checkpoint scores persist.
- Mastery resolves correctly.
- Later lessons unlock after completion.
- The correct laptop window is selected automatically.
- Existing song courses remain unaffected.

### Phase 6: Complete foundational theory checkpoints

**Goal:** Support lessons 1-11.

Tasks:

1. Implement item ordering.
2. Implement note naming.
3. Implement enharmonic selection.
4. Implement interval building.
5. Implement chord building.
6. Implement chord-spelling questions.
7. Add reusable scale and chord generation utilities.
8. Author remaining keyboard, scale, interval, and chord lessons.
9. Add course-overview module completion summaries.

Acceptance criteria:

- Lessons 1-11 are playable end to end.
- Every lesson has at least one conceptual checkpoint.
- Every generated theory target is deterministic in tests.
- Enharmonic spelling remains distinct while pitch scoring remains correct.

### Phase 7: Rhythm and staff systems

**Goal:** Support lessons 12-14.

Tasks:

1. Add rhythm notation data structures.
2. Add beat/measure visualisation.
3. Add tap or piano rhythm assessment.
4. Add 3/4 and 4/4 measure handling.
5. Add staff notation renderer.
6. Add staff-to-piano interaction.
7. Add rhythm-performance and staff-reading checkpoints.
8. Author Note Values, Time Signatures, and Grand Staff lessons.

Acceptance criteria:

- Rhythm durations align with the transport.
- Rhythm scoring is repeatable and respects tempo controls.
- Staff notes map to correct MIDI pitches and spellings.
- Accessible text alternatives exist for notation.

### Phase 8: Progressions and final mastery

**Goal:** Complete the course with applied chord progressions and a mixed assessment.

Tasks:

1. Author C-G-Am-F and Am-F-C-G progression timelines.
2. Add scale-degree labels.
3. Add guided and performance variants.
4. Add final mixed checkpoint.
5. Add course completion and mastery summary.
6. Add review links to weak lessons.

Acceptance criteria:

- The learner performs at least one complete progression.
- The final checkpoint covers notes, scales, intervals, chords, spelling, and rhythm.
- Course completion persists.
- Weak domains link back to the relevant lesson.

### Phase 9: Hardening and release preparation

Tasks:

1. Run full accessibility review.
2. Test common UK, US, and international keyboard layouts.
3. Test laptop chord ghosting combinations.
4. Test mobile landscape and desktop scrolling.
5. Test progress migration and recovery from malformed storage.
6. Audit curriculum content and source metadata.
7. Measure bundle and rendering performance.
8. Update README course list and authoring documentation.
9. Capture screenshots or recordings for visible changes.
10. Prepare release notes.

## 16. Test Strategy

### 16.1 Shared-domain unit tests

Cover:

- MIDI bounds;
- MIDI-to-label conversion;
- spelling-to-MIDI conversion;
- enharmonic equality;
- white/black-key detection;
- piano-key generation;
- laptop offsets;
- octave shifts;
- window selection;
- scale generation;
- interval generation;
- chord generation; and
- mastery resolution.

### 16.2 API tests

Cover:

- course validation;
- module validation;
- tutorial block validation;
- checkpoint validation;
- spelling/pitch agreement;
- legacy normalisation;
- seeded course retrieval;
- existing course compatibility; and
- lesson detail responses.

### 16.3 Client tests

Cover:

- expanded piano key count;
- correct shortcut badges;
- octave controls;
- keyboard-code input;
- held-note cleanup;
- auto-centering;
- stage navigation;
- content rendering;
- explore activity behaviour;
- checkpoint scoring;
- progress migration;
- mastery display; and
- non-tutorial fallback.

### 16.4 Browser tests

Required flows:

1. Start Keyboard Geography from a clean browser.
2. Complete Learn and Explore.
3. Complete practice through laptop input.
4. Complete checkpoint.
5. Confirm mastery and next-lesson unlock.
6. Reload and confirm persisted progress.
7. Shift octaves in Freestyle Mode.
8. Confirm shifting is locked during lesson playback.
9. Complete a chord lesson with simultaneous key input.
10. Confirm an existing song lesson still works.
11. Confirm mobile landscape keeps targets visible.
12. Confirm v1 progress migrates safely.

### 16.5 Verification commands

Every implementation phase must run the relevant subset, and release verification must run all commands:

```bash
npm install
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Course-data phases must also run:

```bash
npm run seed:courses
npm run audit:songs -w @piano360/api
```

## 17. Security, Privacy, and Data Integrity

- Do not add secrets or credentials.
- Continue storing learner progress locally for this release.
- Treat lesson content as trusted seeded data, but validate every content block.
- Do not render arbitrary HTML from course content.
- Do not evaluate formulas or scripts from authored content.
- Clamp every pitch and keyboard range.
- Ignore keyboard shortcuts when focus is in editable controls.
- Preserve existing timeline provenance and review rules.
- Do not silently reset valid learner progress.

## 18. Risks and Mitigations

### Pitch migration breadth

**Risk:** Note strings are used across API types, client types, audio, scoring, chord recognition, seeds, and tests.

**Mitigation:** Introduce a shared domain and legacy adapters first. Migrate in one monorepo phase with regression tests before authoring tutorial content.

### Existing-course regression

**Risk:** Optional tutorial and MIDI changes could break songs or current drills.

**Mitigation:** Preserve a non-tutorial fallback and add browser regression tests for foundational and timeline lessons.

### Laptop chord ghosting

**Risk:** Some physical keyboards fail to register specific triads.

**Mitigation:** Test curriculum combinations, support pointer input, provide partial-chord guidance, and avoid problematic combinations where possible.

### Four-octave usability

**Risk:** Showing all keys simultaneously creates keys too small to use.

**Mitigation:** Keep minimum key widths, scroll horizontally, auto-centre targets, and display only the active window labels.

### Content overload

**Risk:** Theory lessons become long articles.

**Mitigation:** One concept per block, concise explanations, interactive exploration, estimated lesson time, and three-lesson UX validation before full authoring.

### Progress migration

**Risk:** Learners lose previous completion data.

**Mitigation:** Read v1 safely, preserve the original until v2 saves, and test malformed/partial records.

### Enharmonic confusion

**Risk:** Canonical sharp labels erase theoretical spelling.

**Mitigation:** Use MIDI for sounding identity and explicit spelling metadata for display and theory evaluation.

## 19. Definition of Done

The feature is complete when:

- the virtual piano supports C2-C6;
- the current laptop layout controls a movable 16-note window;
- Z/X octave shifting works where allowed;
- lessons select and lock a suitable input window;
- physical keyboard mapping uses `KeyboardEvent.code`;
- sounding pitch and note spelling are separate;
- tutorial lessons support all six stages;
- stage and mastery progress persist locally;
- Music Theory Foundations contains all fifteen lessons;
- existing courses remain functional;
- required unit, API, client, and browser tests pass;
- lint, type checking, build, and formatting checks pass;
- curriculum content has been reviewed; and
- repository documentation is updated.

## 20. Implementation Approval Gate

This document authorises planning and task breakdown only. It does not authorise application-code changes by itself.

Before implementation begins:

1. The user explicitly approves this specification or identifies required edits.
2. The first implementation task is marked `ready`.
3. Repository state is revalidated.
4. Work is performed in an isolated branch and pull request unless the user separately authorises direct implementation on `main`.
5. Each phase is verified before the next dependent phase begins.

## 21. First Recommended Implementation Task

After approval, begin with:

```text
Phase 1: Shared pitch and keyboard domain
```

This is the smallest dependency-safe starting point because every later keyboard, tutorial, scale, interval, chord, rhythm, and notation feature relies on a stable pitch representation and input-window model.
