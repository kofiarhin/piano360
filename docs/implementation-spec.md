# Piano360 Implementation Specification

## 1. Purpose

This specification translates the Piano360 PRD into an implementation-ready plan for the Piano360 MVP while preserving the long-term architecture needed for the full product vision.

Piano360 is a responsive web-based piano learning platform that helps learners build keyboard fluency through guided visual instruction, repetition, muscle-memory training, and real-time feedback.

The MVP must ship a coherent beginner practice loop without blocking on unreliable browser pitch detection. However, the architecture must treat real-time validation, MIDI support, adaptive practice, and skill mastery as first-class future capabilities.

## 2. Product Vision Alignment

The core PRD vision is not simply to teach songs. Piano360 trains learners to play without looking at the keyboard, similar to touch typing.

Every product decision must support at least one of these goals:

- Improve keyboard spatial awareness.
- Build finger placement memory.
- Reduce cognitive load during practice.
- Encourage repetition without friction.
- Help learners stop looking down at the keys.
- Provide clear visual guidance before, during, and after playing.

The MVP may use manual validation, but the product should still feel like a visual piano coach, not a passive content library.

## 3. MVP Summary

The MVP focuses on the core beginner loop:

1. User opens the app without an account.
2. User sees a recommended beginner path.
3. User starts a short exercise.
4. App displays a virtual piano, required keys, hand side, and finger numbers.
5. User plays on a real piano.
6. User validates the attempt manually.
7. App gives feedback, advances the exercise, and records local progress.
8. User can return later and continue practice on the same device.

Pitch detection is allowed as a progressive enhancement, but manual validation must remain the required MVP path.

## 4. MVP Goals

The MVP must allow an absolute beginner to:

- Browse ordered beginner lessons.
- Start guided practice exercises.
- See a responsive virtual piano keyboard.
- See highlighted keys, hand guidance, and finger numbers.
- Step through short drills.
- Manually mark attempts as correct, retry, or skipped.
- Complete exercises without sign-in, microphone permission, or backend content.
- Track local progress, streaks, recent practice, and basic mastery indicators.
- Use free practice mode to explore notes and keyboard geography.

## 5. Non-Goals for MVP

The MVP must not require:

- User accounts.
- Authentication.
- Cloud sync.
- Database persistence.
- Server-side content management.
- Required microphone validation.
- Production-grade chord recognition.
- MIDI keyboard input.
- Paid content.
- Subscriptions.
- Full song learning.
- Advanced inversions.
- Advanced two-hand independence curriculum.

These are future phases.

## 6. Core Product Modes

### 6.1 Lesson Mode

Lesson mode provides ordered beginner curriculum grouped by learning objective.

It should answer:

- What should I learn next?
- Why does this exercise matter?
- What skill does it train?
- How far through the path am I?

### 6.2 Guided Practice Mode

Guided practice is the primary experience.

It displays:

- Current instruction.
- Virtual piano.
- Highlighted target notes.
- Hand guidance.
- Finger numbers.
- Step progress.
- Validation controls.
- Feedback and completion summary.

### 6.3 Free Practice Mode

Free practice is required for MVP because keyboard exploration supports the PRD goal of spatial fluency.

Free practice should allow users to:

- Tap or click virtual keys.
- See note names and octave labels.
- Toggle note labels.
- Toggle finger-number hints.
- Explore middle-C orientation.
- Practice without a structured exercise.

Route:

```txt
/practice/free
```

Free practice does not need progress scoring in MVP, but sessions may count toward recent activity later.

### 6.4 Library Mode

The library is a compact reference surface for MVP concepts:

- Notes.
- Intervals.
- Major triads.
- Minor triads.
- Simple chord progressions.
- Five-finger positions.
- Included exercises.

The library should reuse the same static content source as lessons and exercises.

### 6.5 Progress Mode

Progress mode summarizes local device progress:

- Completed exercises.
- Current streak.
- Last practiced date.
- Recent exercises.
- Skill-level progress.
- Category-level completion.
- Practice sessions.
- Reset local progress action.

It must clearly say that progress is stored on the current device for MVP.

## 7. Target Learner

The MVP targets absolute beginners who may not know:

- Note names.
- Keyboard geography.
- Finger numbering.
- Basic intervals.
- Triad shapes.
- Simple chord movement.

UI language must be direct, plain, and action-oriented. Avoid heavy theory unless a step introduces it.

## 8. Learning Scope

### 8.1 Included MVP Content

The initial static curriculum should include small curated exercises across:

- Middle C orientation.
- White-key note recognition.
- Right-hand finger numbering.
- Left-hand finger numbering.
- Five-finger C position.
- Stepwise movement by seconds.
- Skips by thirds.
- Fourths and fifths.
- C major triad.
- A minor triad.
- Simple chord transitions.
- Basic I-IV-V-I style chord progression concept.
- Short repetition drills for muscle memory.

### 8.2 Future Scope

Document but do not require for MVP:

- Full songs.
- Advanced scales.
- Chord inversions.
- Arpeggios.
- Sight reading.
- Ear training.
- Two-hand independence curriculum.
- MIDI validation.
- Account-based sync.
- Hosted content management.

## 9. Required Routes

```txt
/
/lessons
/practice/free
/practice/:exerciseId
/library
/progress
```

Requirements:

- Direct links to valid exercise IDs must open the correct exercise.
- Invalid exercise IDs must show a recoverable not-found state.
- Navigation must be usable on mobile, tablet, and desktop.
- Tablet should be treated as the primary learning layout.

## 10. Core User Flows

### 10.1 First Visit

1. User opens `/`.
2. App initializes local progress if none exists.
3. Home shows next recommended exercise and free practice entry.
4. User can start the first exercise within one interaction.

Acceptance criteria:

- No sign-in required.
- No browser storage required to render.
- Clear first action.
- No marketing-heavy landing page.

### 10.2 Select Lesson Exercise

1. User opens `/lessons`.
2. App shows ordered lesson groups.
3. Each exercise card shows title, description, category, skill, duration, difficulty, and completion state.
4. User selects an unlocked exercise.
5. App navigates to `/practice/:exerciseId`.

Acceptance criteria:

- Static client content drives the catalog.
- Completed and incomplete states are visible.
- Locked prerequisites are optional but supported.
- Layout works on mobile and tablet.

### 10.3 Guided Practice

1. App loads the exercise by ID.
2. Practice engine initializes session state.
3. Current step instruction appears.
4. Virtual piano highlights target notes.
5. Finger and hand guidance appears.
6. User plays on real piano.
7. User chooses Correct, Try Again, or Skip.
8. Validation engine records result.
9. Practice engine advances according to exercise rules.
10. Completion updates local progress and mastery state.

Acceptance criteria:

- Practice works without microphone permission.
- Restart is available.
- Return to lessons is available.
- Session recovery survives refresh when practical.
- Completed state appears in lessons and progress.

### 10.4 Free Practice

1. User opens `/practice/free`.
2. App displays a configurable keyboard around middle C.
3. User interacts with keys.
4. App displays note name, octave, key type, and optional guidance.
5. User can toggle labels and hints.

Acceptance criteria:

- No exercise required.
- No microphone required.
- Works with touch input.
- Supports horizontal scrolling or reduced key range on narrow screens.

## 11. Domain Model

The app should be designed around explicit domain concepts rather than UI-only structures.

Core domain entities:

```txt
Lesson
Exercise
PracticeStep
NoteTarget
Skill
SkillGroup
PracticeSession
PracticeAttempt
ValidationResult
ProgressSnapshot
Recommendation
```

### 11.1 Lesson

A lesson groups exercises around a learning objective.

Required fields:

- `id`
- `title`
- `description`
- `level`
- `objective`
- `exerciseIds`
- `skillIds`
- `order`

### 11.2 Exercise

An exercise is a structured practice unit.

Required fields:

- `id`
- `title`
- `description`
- `category`
- `difficulty`
- `estimatedMinutes`
- `lessonId`
- `skillIds`
- `keyboardRange`
- `steps`
- `completionRule`
- `validationModes`
- `prerequisiteExerciseIds`

### 11.3 PracticeStep

A step is one action the learner performs.

Required fields:

- `id`
- `instruction`
- `targetNotes`
- `expectedHand`
- `skippable`
- `validationModes`
- `successFeedback`
- `retryHint`
- `timing` optional future field

### 11.4 NoteTarget

A note target describes what should be shown and validated.

Required fields:

- `note`
- `octave`
- `hand`
- `finger`
- `role`
- `displayLabel`

Example:

```ts
{
  note: 'C',
  octave: 4,
  hand: 'right',
  finger: 1,
  role: 'root',
  displayLabel: 'Middle C'
}
```

### 11.5 Skill

A skill represents what an exercise trains.

Examples:

- `middle-c-orientation`
- `right-hand-finger-numbers`
- `left-hand-finger-numbers`
- `white-key-geography`
- `major-triad-shape`
- `minor-triad-shape`
- `chord-transition-control`
- `basic-progression-memory`

Required fields:

- `id`
- `title`
- `description`
- `group`
- `level`
- `masteryThreshold`

## 12. Skill Graph

The MVP should include a simple static skill graph.

The skill graph allows the product to answer:

- What has the learner practiced?
- What skill is weak?
- What should the learner do next?
- Which exercises unlock after prerequisites?

MVP graph can be a simple dependency list.

Example:

```ts
{
  id: 'major-triad-shape',
  prerequisiteSkillIds: ['white-key-geography', 'finger-numbers']
}
```

The MVP does not need adaptive recommendations, but the data model must support them.

## 13. Content Architecture

MVP content is static, typed, and versioned in the client.

Recommended location:

```txt
apps/client/src/content/
```

Recommended files:

```txt
types.ts
notes.ts
chords.ts
scales.ts
progressions.ts
skills.ts
lessons.ts
exercises.ts
index.ts
```

Requirements:

- Export a `CONTENT_VERSION` string.
- Exercise IDs must be stable.
- Lesson IDs must be stable.
- Skill IDs must be stable.
- Content must be validated by tests.
- Content should be easy to move behind an API later.

## 14. Practice Engine

Practice flow must not live directly inside React components.

Create a practice engine that handles:

- Session initialization.
- Step state.
- Attempt recording.
- Validation result handling.
- Step advancement.
- Restart.
- Completion summary.

Recommended location:

```txt
apps/client/src/features/practice/
```

Recommended files:

```txt
types.ts
practiceEngine.ts
practiceReducer.ts
practiceSelectors.ts
validation.ts
usePracticeSession.ts
```

### 14.1 Practice State

Practice session state should include:

- `exerciseId`
- `startedAt`
- `currentStepIndex`
- `stepResults`
- `attempts`
- `status`
- `completedAt`

Statuses:

```ts
type PracticeSessionStatus = 'idle' | 'active' | 'completed' | 'abandoned';
```

Step states:

```ts
type PracticeStepStatus = 'pending' | 'correct' | 'retry' | 'skipped';
```

## 15. Validation Engine

Validation must be strategy-based so manual validation can later be replaced or augmented by pitch and MIDI validation without rewriting practice UI.

Validation modes:

```ts
type ValidationMode = 'manual' | 'pitch' | 'pitch-and-timing' | 'midi';
```

Validation result:

```ts
type ValidationResult = {
  mode: ValidationMode;
  status: 'correct' | 'incorrect' | 'skipped' | 'low-confidence';
  stepId: string;
  timestamp: string;
  confidence?: number;
  detectedNotes?: string[];
  message?: string;
};
```

Validator interface:

```ts
interface Validator {
  mode: ValidationMode;
  validate(input: unknown): Promise<ValidationResult> | ValidationResult;
}
```

MVP validators:

- `ManualValidator` required.
- `PitchValidator` optional placeholder.
- `MidiValidator` future.

Manual controls:

- Correct.
- Try Again.
- Skip.
- Restart.

Manual validation must remain available even when pitch detection is enabled.

## 16. Pitch Detection Architecture

Pitch detection is part of the PRD vision but not an MVP blocker.

Implementation rules:

- Isolate audio logic under `features/audio` or `features/validation/audio`.
- Use browser-native Web Audio APIs first.
- Prefer open-source browser-based pitch detection before paid APIs.
- Require capability checks.
- Require microphone permission checks.
- Show calibration/readiness state.
- Fail gracefully.
- Never block manual practice.

Recommended files:

```txt
features/audio/types.ts
features/audio/useMicrophonePermission.ts
features/audio/pitchDetection.ts
features/audio/audioValidationAdapter.ts
```

Future pitch validation should support:

- Single-note detection first.
- Octave detection.
- Tuning tolerance.
- Confidence thresholds.
- Chord detection later.
- Timing validation later.

## 17. Timing Model

The PRD requires timing validation long-term. The MVP does not need real-time timing scoring, but the model should allow it.

Practice steps may include optional timing metadata:

```ts
type StepTiming = {
  bpm?: number;
  beats?: number;
  expectedDurationMs?: number;
  toleranceMs?: number;
};
```

Future validation modes can use this for rhythm, tempo, and timing feedback.

## 18. Virtual Piano Specification

The virtual piano is the visual core of Piano360.

### 18.1 Keyboard Range

MVP default:

- Beginner range around middle C.
- At least one octave below and one octave above middle C when space allows.
- Exercise-specific range override.

### 18.2 Key Data

Each rendered key should support:

- `noteId`
- `noteName`
- `octave`
- `keyType`
- `displayLabel`
- `highlightState`
- `hand`
- `finger`
- `isTarget`

Highlight states:

```ts
type KeyHighlightState = 'none' | 'target' | 'correct' | 'incorrect' | 'completed' | 'pending';
```

### 18.3 Responsive Behavior

The keyboard must work on:

- Desktop.
- Tablet landscape.
- Tablet portrait.
- Mobile portrait.

At narrow widths:

- Reduce visible range.
- Allow horizontal scroll.
- Use denser labels.
- Prioritize target notes.

Do not rely on hover.

## 19. Progress and Mastery Model

Progress is local-only for MVP.

Recommended location:

```txt
apps/client/src/features/progress/
```

Recommended files:

```txt
types.ts
storage.ts
progressReducer.ts
progressSelectors.ts
useProgress.ts
```

### 19.1 Stored Fields

Local progress should include:

- `schemaVersion`
- `contentVersion`
- `completedExerciseIds`
- `exerciseStats`
- `skillStats`
- `lastPracticedDate`
- `currentStreak`
- `recentExerciseIds`
- `lastActiveExerciseId`
- `totalPracticeSessions`

### 19.2 Exercise Stats

```ts
type ExerciseProgress = {
  exerciseId: string;
  completedAt?: string;
  attempts: number;
  correctAttempts: number;
  retryAttempts: number;
  skippedSteps: number;
  completionCount: number;
  lastPracticedAt: string;
};
```

### 19.3 Skill Stats

Skill tracking helps align the product with keyboard fluency instead of simple completion.

```ts
type SkillProgress = {
  skillId: string;
  practiceCount: number;
  correctCount: number;
  retryCount: number;
  confidence: number;
  mastery: 'unseen' | 'introduced' | 'practicing' | 'comfortable' | 'mastered';
  lastPracticedAt?: string;
};
```

MVP confidence can be a simple derived score from manual attempts. It should not be presented as scientific accuracy.

### 19.4 Streak Rules

- A practice day counts when the user completes at least one exercise.
- Multiple completions on the same day increase practice count but not streak count.
- Consecutive local calendar days increase streak.
- Missing a day resets streak on the next completed exercise.

## 20. Recommendation Engine

MVP recommendation can be simple and deterministic.

Recommended logic:

1. Continue last active incomplete exercise.
2. Else start the first unlocked incomplete exercise.
3. Else recommend free practice or review weak skills.

Keep recommendation logic outside components.

Recommended location:

```txt
apps/client/src/features/recommendations/
```

Files:

```txt
recommendationEngine.ts
recommendationSelectors.ts
```

## 21. App Architecture

Use React, Vite, TypeScript, Tailwind CSS, React Router, Zod, Vitest, and React Testing Library.

Backend remains Node.js, Express, TypeScript, Jest, and Supertest.

MVP should not add MongoDB, auth, or server content until required.

### 21.1 Client Structure

Recommended structure:

```txt
apps/client/src/
  app/
    App.tsx
    router.tsx
    AppShell.tsx
    Navigation.tsx
  content/
    types.ts
    notes.ts
    chords.ts
    scales.ts
    progressions.ts
    skills.ts
    lessons.ts
    exercises.ts
    index.ts
  features/
    piano/
      VirtualPiano.tsx
      PianoKey.tsx
      keyboardLayout.ts
      pianoTypes.ts
    lessons/
      LessonsRoute.tsx
      LessonCard.tsx
      lessonSelectors.ts
    practice/
      PracticeRoute.tsx
      FreePracticeRoute.tsx
      PracticeInstruction.tsx
      PracticeControls.tsx
      PracticeSummary.tsx
      FingerGuide.tsx
      practiceEngine.ts
      practiceReducer.ts
      usePracticeSession.ts
      validation.ts
      types.ts
    progress/
      ProgressRoute.tsx
      storage.ts
      useProgress.ts
      progressReducer.ts
      progressSelectors.ts
      types.ts
    library/
      LibraryRoute.tsx
    recommendations/
      recommendationEngine.ts
    audio/
      useMicrophonePermission.ts
      pitchDetection.ts
  shared/
    components/
    utils/
    types/
```

### 21.2 API Structure

MVP API remains minimal:

```http
GET /health
```

No MVP client feature should depend on backend endpoints.

Future API boundaries:

- Hosted lesson content.
- Content version manifests.
- User accounts.
- Synced progress.
- Analytics events.
- Song catalog.

## 22. State Management

MVP should use:

- Static imports for content.
- React state/reducer for active practice session.
- Local storage for durable local progress.
- Custom hooks for feature state.

Do not add Redux, Zustand, or TanStack Query until server state or complex global state exists.

## 23. Local Storage Resilience

The app must handle:

- Empty storage.
- Blocked storage.
- Corrupt JSON.
- Unknown schema version.
- Missing old exercise IDs after content changes.
- New exercises with no progress.

Unknown or malformed progress should be ignored safely and reinitialized.

A reset progress action must exist on `/progress` or a settings area.

## 24. Accessibility Requirements

The MVP must support:

- Keyboard navigation.
- Visible focus states.
- Clear button labels.
- Text alternatives for visual-only key states.
- Non-color-only feedback.
- Sufficient contrast.
- Reduced reliance on sound-only cues.
- Touch-friendly controls.

The virtual piano should expose semantic labels such as:

```txt
C4, white key, right hand finger 1, target note
```

## 25. Responsive Requirements

Primary use case: phone or tablet on a piano music stand.

Design requirements:

- Large tap targets.
- Instruction visible at a glance.
- Minimal clutter.
- Keyboard remains stable during step changes.
- Avoid layout shift from feedback text.
- Support portrait and landscape tablet.
- No hover-only controls.

## 26. Error and Empty States

Required states:

- No progress yet.
- Invalid exercise ID.
- Empty lesson group.
- Local storage unavailable.
- Corrupt progress data.
- Microphone unsupported.
- Microphone permission denied.
- Pitch detection low confidence.
- Content references invalid lesson or skill.

Each state must provide a clear next action.

## 27. Testing Strategy

### 27.1 Client Tests

Use Vitest and React Testing Library.

Required coverage:

- Route rendering for all required routes.
- Valid exercise lookup.
- Invalid exercise not-found state.
- Lesson catalog rendering.
- Free practice route rendering.
- Virtual piano renders target notes.
- Finger numbers render when provided.
- Manual Correct advances step.
- Try Again stays on current step.
- Skip follows exercise rules.
- Restart resets session.
- Completion writes local progress.
- Progress route reads completed exercises.
- Corrupt local storage does not crash.
- Recommendation engine returns next exercise.

### 27.2 Content Tests

Required validation:

- Exercise IDs are unique.
- Lesson IDs are unique.
- Skill IDs are unique.
- Exercises reference existing lessons.
- Exercises reference existing skills.
- Steps have valid target notes unless intentionally instructional.
- Target notes fit keyboard range.
- Prerequisite exercises exist.
- Skill prerequisites exist.

### 27.3 API Tests

Keep health check coverage only for MVP.

## 28. Acceptance Criteria

MVP is complete when:

- All required routes exist.
- Beginner lessons load from static typed content.
- User can start and complete at least one exercise without sign-in.
- Practice shows a virtual piano with highlighted target notes.
- Practice shows hand and finger guidance.
- Manual validation supports Correct, Try Again, Skip, and Restart.
- Free practice mode exists.
- Completion updates local progress.
- Progress route reflects completed exercises, streak, recent practice, and basic skill progress.
- App works without microphone permission.
- Invalid exercise IDs recover gracefully.
- Local storage failures do not crash the app.
- Client tests cover practice, progress, content integrity, and free practice.
- API remains compatible with `GET /health`.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass before release.

## 29. Risks and Mitigations

### 29.1 Pitch Detection Reliability

Risk: Browser microphone detection may be unreliable across devices, rooms, tuning differences, and chords.

Mitigation: Manual validation is required. Pitch detection is progressive enhancement.

### 29.2 Manual Validation Accuracy

Risk: Users may mark incorrect playing as correct.

Mitigation: Manual validation preserves MVP usability. Future pitch and MIDI validation improve confidence.

### 29.3 Static Content Updates

Risk: Bundled content requires redeploys.

Mitigation: Use stable typed schemas and content versioning so content can later move behind an API.

### 29.4 Local Progress Loss

Risk: Browser storage can be cleared or unavailable.

Mitigation: Clearly state local-only storage. Defer cloud sync.

### 29.5 Mobile Keyboard Usability

Risk: Virtual piano can be cramped on phones.

Mitigation: Use configurable ranges, horizontal scroll, large controls, and target-note prioritization.

## 30. Future Phases

### 30.1 Pitch Detection Phase

- Microphone setup flow.
- Calibration.
- Single-note detection.
- Octave validation.
- Confidence thresholds.
- Tuning tolerance.
- Exercise-level pitch validation.

### 30.2 Timing Validation Phase

- BPM-aware steps.
- Rhythm drills.
- Timing tolerance.
- Correct note with wrong timing feedback.

### 30.3 MIDI Phase

- Web MIDI support.
- MIDI note-on and note-off validation.
- Chord validation.
- Timing validation.
- Device setup flow.

### 30.4 Accounts and Sync Phase

- JWT authentication.
- Refresh tokens.
- User profile.
- Cloud progress.
- Cross-device resume.
- Progress backup.

### 30.5 Hosted Content Phase

- API-served lessons.
- Content version manifest.
- Editorial workflow.
- Feature flags.

### 30.6 Expanded Curriculum Phase

- Full songs.
- Advanced scales.
- Chord inversions.
- Arpeggios.
- Two-hand independence.
- Sight reading.
- Ear training.

## 31. Implementation Checkpoints

Build order:

1. Create app shell and routes.
2. Define domain and content types.
3. Seed notes, skills, lessons, and beginner exercises.
4. Build virtual piano and keyboard layout utilities.
5. Build practice engine and manual validation.
6. Build guided practice route.
7. Build free practice route.
8. Add local progress storage and progress route.
9. Add recommendation engine.
10. Add library route from shared content.
11. Add resilience for invalid IDs, corrupt storage, and empty states.
12. Add content integrity tests.
13. Add practice and progress tests.
14. Keep API health check passing.
15. Optionally add microphone permission placeholder behind progressive enhancement.

## 32. Definition of Done

Piano360 MVP is done when a new user can open the app on phone, tablet, or desktop; start a beginner exercise; follow visual key and finger guidance; complete the exercise through manual validation; use free practice mode; and see local progress saved without needing an account, microphone permission, or backend content service.

The implementation must preserve the long-term PRD direction: real-time validation, adaptive skill mastery, MIDI support, hosted curriculum, and the central mission of helping learners play piano without looking at the keyboard.
