# Piano360 MVP Implementation Specification

## 1. Purpose

This specification translates `Piano360_PRD.txt` into an implementation-ready MVP plan for the existing Piano360 monorepo.

Piano360 is a responsive web application that helps absolute beginners build piano keyboard fluency through guided visual instruction, repetition, and practice feedback. The MVP focuses on the core learning loop: choose an exercise, see what to play, practice on a real piano, validate progress manually, and track local improvement.

The long-term PRD vision includes real-time pitch detection, MIDI support, full songs, cloud progress, and broader lesson content. Those are intentionally separated from the MVP so the first release can ship a coherent beginner practice experience.

## 2. Existing Repository Context

The repository is an npm workspaces monorepo:

- `apps/client`: React 19, Vite, TypeScript, Vitest, React Testing Library.
- `apps/api`: Node.js, Express, TypeScript, Jest, Supertest.
- Root tooling: npm workspaces, ESLint, Prettier, TypeScript.
- Current API surface: `GET /health`.

The MVP should preserve this architecture. Most product work belongs in `apps/client`. The API should remain minimal for MVP.

## 3. MVP Goals

The MVP must let an absolute beginner:

- Browse a small structured lesson and exercise set.
- Start a guided practice exercise.
- See a responsive virtual piano keyboard.
- See required keys, finger numbers, and hand guidance.
- Step through short drills.
- Mark attempts as correct, retry, or skip according to exercise rules.
- Track completed exercises, streaks, recent practice state, and basic progress locally.
- Continue using the app without microphone permission or network-backed user accounts.

## 4. Non-Goals

The MVP must not require:

- User accounts.
- Authentication.
- Cloud sync.
- Server-side content management.
- Database persistence.
- Required microphone pitch detection.
- Production-grade chord recognition from audio.
- MIDI device input.
- Full song learning.
- Advanced scales.
- Advanced chord inversions.
- Advanced hand independence training.
- Paid content, subscriptions, or payments.

## 5. Target Learner

The MVP targets absolute beginners who may not know:

- Note names.
- Keyboard geography.
- Finger numbering.
- Basic intervals.
- Major or minor triads.
- Simple chord movement.

The MVP should use plain learner-facing language and avoid assuming music theory knowledge beyond what each exercise introduces.

## 6. MVP Learning Scope

### 6.1 Included Content

MVP content should include a small curated set of exercises across these categories:

- Note recognition around middle C.
- White-key orientation and keyboard geography.
- Right-hand and left-hand finger numbering.
- Five-finger positions.
- Simple intervals such as seconds, thirds, fourths, and fifths.
- Basic major and minor triads.
- Simple chord transitions.
- Short guided drills that reinforce muscle memory.

### 6.2 Excluded Content

The following should be documented in the product as future scope if referenced, but not implemented as required MVP flows:

- Full song tutorials.
- Advanced scales.
- Advanced inversions.
- Arpeggio systems.
- Sight-reading curriculum.
- Ear training curriculum.
- Two-hand independence curriculum.
- MIDI-based validation.
- Account-based progress.

## 7. Required Routes

The MVP should use route-level navigation:

- `/`: Home or dashboard entry point.
- `/lessons`: Ordered beginner lesson catalog.
- `/practice/:exerciseId`: Guided practice surface for a specific exercise.
- `/library`: Browse reference content such as notes, chords, scales, and exercise types included in MVP.
- `/progress`: Local progress summary.

Direct links to valid exercise IDs must open the relevant practice screen. Invalid exercise IDs must show a recoverable not-found state with a path back to `/lessons`.

## 8. Core User Flows

### 8.1 First Visit

1. User opens `/`.
2. App explains the current learning path through concise UI, not long marketing copy.
3. User can start the first recommended lesson or browse lessons.
4. App initializes local progress state if none exists.

Acceptance criteria:

- First visit works without sign-in.
- First visit works with no existing browser storage.
- User has a clear path to first practice within one interaction.

### 8.2 Select an Exercise

1. User opens `/lessons`.
2. App shows beginner lesson groups in recommended order.
3. Each exercise shows title, category, estimated duration, difficulty, completion state, and locked/unlocked state if sequencing is enforced.
4. User selects an unlocked exercise.
5. App navigates to `/practice/:exerciseId`.

Acceptance criteria:

- Completed and incomplete exercises are visually distinguishable.
- Exercise metadata comes from static client content.
- The catalog remains usable on mobile and tablet widths.

### 8.3 Guided Practice

1. App loads the exercise by `exerciseId`.
2. App displays the current step instruction.
3. App highlights required virtual piano keys.
4. App shows hand side and finger numbers where relevant.
5. User plays on a real piano.
6. User chooses `Correct`, `Try Again`, or `Skip` depending on the step state.
7. App updates the attempt state and advances only when the validation rule allows it.
8. Exercise completion updates local progress.

Acceptance criteria:

- Practice can be completed entirely without microphone access.
- User can restart the exercise.
- User can return to lessons.
- Exercise state survives page refresh when practical through recent practice storage.
- A completed exercise is reflected on `/lessons` and `/progress`.

### 8.4 Manual Validation

Manual validation is the required MVP path.

The user manually confirms whether they played correctly. The app should make this explicit through controls and feedback states, while keeping the flow fast enough for repeated practice.

Required controls:

- `Correct`: records a successful attempt for the current step.
- `Try Again`: records an unsuccessful attempt and keeps the user on the step.
- `Skip`: moves forward only if the exercise allows skipping.
- `Restart`: resets the current exercise session.

Acceptance criteria:

- Manual validation does not depend on microphone permission.
- Attempts are stored in session state and summarized at exercise completion.
- Exercises can specify whether skipped steps count as completion.

### 8.5 Optional Pitch Detection

Pitch detection is a progressive enhancement, not an MVP blocker.

If implemented in the MVP, it must be behind:

- Browser capability checks.
- Microphone permission checks.
- A calibration or readiness state.
- A clear fallback to manual validation.

The app must continue to work when:

- The browser does not support required audio APIs.
- The user denies microphone permission.
- The environment is noisy.
- The piano is out of tune.
- Chords cannot be detected reliably.
- Mobile browser constraints prevent stable audio analysis.

Acceptance criteria:

- Microphone detection cannot be required to enter or complete practice.
- Permission denial shows a non-blocking message.
- Manual controls remain available when pitch detection is active.

## 9. Frontend Behavior

### 9.1 App Shell

The app shell should include:

- Primary navigation for Home, Lessons, Library, and Progress.
- Responsive layout for desktop, tablet, and mobile.
- A practice-first information hierarchy.
- Clear current route indication.

On phones and tablets, controls should be large enough for quick use while the device sits on a piano music stand.

### 9.2 Home Route

The home route should prioritize returning to practice:

- Continue recent exercise if available.
- Start next recommended exercise.
- Show compact local progress summary.
- Link to lessons and library.

It should not be a marketing landing page.

### 9.3 Lessons Route

The lessons route should show ordered beginner content grouped by learning objective.

Each exercise item should include:

- Title.
- Short description.
- Category.
- Difficulty.
- Estimated duration.
- Completion state.
- Start or continue action.

### 9.4 Practice Route

The practice route is the primary experience.

Required regions:

- Exercise header with title, category, and progress through steps.
- Instruction panel for the current step.
- Virtual piano keyboard.
- Finger and hand guidance.
- Validation controls.
- Feedback area.
- Session summary at completion.

The practice route should avoid clutter. The keyboard and current instruction must remain the dominant elements.

### 9.5 Library Route

The library route is a reference surface for MVP concepts:

- Notes included in the beginner range.
- Basic intervals.
- Major and minor triads.
- Simple five-finger positions.
- Included exercises.

It should read from the same static content source as lessons where possible.

### 9.6 Progress Route

The progress route should summarize local progress:

- Completed exercises.
- Current streak.
- Last practiced date.
- Recent exercises.
- Category-level completion.
- Total practice sessions.

It must explain, through concise UI text, that progress is stored on the current device for MVP.

## 10. Virtual Piano Requirements

### 10.1 Keyboard Range

For MVP, the virtual piano does not need to render all 88 keys by default. It should support a configurable range appropriate to the exercise.

Recommended default:

- Beginner visible range around middle C.
- At least one octave below and one octave above middle C when space allows.
- Exercise-specific range override.

### 10.2 Key Rendering

Each key should support:

- Note ID.
- Display label.
- Octave.
- White or black key type.
- Highlight state.
- Correct, incorrect, pending, and completed states.
- Finger number overlay.
- Hand indicator.

### 10.3 Responsive Behavior

The keyboard must remain usable across:

- Desktop browser.
- Tablet landscape.
- Tablet portrait.
- Mobile portrait.

At narrow widths, the app may:

- Reduce visible octave range.
- Allow horizontal scrolling.
- Use denser labels.
- Prioritize highlighted keys and current instruction.

The keyboard must not rely on hover-only interactions.

## 11. Content Model

MVP content should be static and versioned in the client. TypeScript modules are preferred for type safety, though JSON can be used if paired with schema validation or typed imports.

Recommended location:

- `apps/client/src/content/`

Recommended files:

- `content/types.ts`
- `content/notes.ts`
- `content/chords.ts`
- `content/exercises.ts`
- `content/lessons.ts`
- `content/index.ts`

### 11.1 Core Types

Recommended concepts:

```ts
type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

type Hand = 'left' | 'right' | 'both';

type ExerciseCategory =
  | 'note-recognition'
  | 'finger-placement'
  | 'intervals'
  | 'chords'
  | 'chord-transitions'
  | 'drills';
```

Exact implementation names may differ, but the model must capture the same information.

### 11.2 Exercise Fields

Each exercise should define:

- Stable `id`.
- `title`.
- `description`.
- `category`.
- `difficulty`.
- `estimatedMinutes`.
- `lessonId` or grouping reference.
- Required keyboard range.
- Ordered practice steps.
- Completion rules.
- Optional prerequisites.

### 11.3 Practice Step Fields

Each practice step should define:

- Stable `id`.
- Instruction text.
- Target notes.
- Expected hand.
- Finger numbers where applicable.
- Whether the step is skippable.
- Validation mode support.
- Optional success feedback.
- Optional retry hint.

### 11.4 Note Target Fields

Each note target should define:

- Note name.
- Octave.
- Optional enharmonic display preference.
- Hand.
- Finger number.
- Role in chord or interval where relevant.

Example concept:

```ts
{
  note: 'C',
  octave: 4,
  hand: 'right',
  finger: 1
}
```

### 11.5 Content Versioning

Content should expose a content version string. Local progress should store the content version used when progress was written.

If content changes later, the app should tolerate:

- Missing old exercise IDs.
- New exercises with no progress.
- Renamed titles with stable IDs.

## 12. Local Progress Model

Progress is local-only for MVP.

Recommended storage:

- `localStorage` for durable local progress.
- In-memory React state for active practice session.
- Optional `sessionStorage` for temporary in-progress session recovery.

Recommended location:

- `apps/client/src/progress/`

Recommended files:

- `progress/types.ts`
- `progress/storage.ts`
- `progress/useProgress.ts`
- `progress/progressReducer.ts` if state transitions grow complex.

### 12.1 Stored Fields

Local progress should include:

- Schema version.
- Content version.
- Completed exercise IDs.
- Exercise completion timestamps.
- Attempt counts per exercise.
- Last practiced date.
- Current streak count.
- Recent exercise IDs.
- Last active exercise ID.
- Optional per-category completion summary cache.

### 12.2 Data Migration

The progress store must include a schema version so future app versions can migrate or reset incompatible data intentionally.

For MVP:

- Unknown or malformed progress should be ignored safely.
- The app should reinitialize progress rather than crash.
- A reset-progress action should be available on the progress route or settings area.

### 12.3 Streak Rules

Recommended MVP streak behavior:

- A practice day counts when the user completes at least one exercise.
- Consecutive local calendar days increase the streak.
- Completing multiple exercises on the same day does not increase the streak more than once.
- Missing a day resets the streak on the next completed exercise.

The streak should be treated as motivational, not authoritative.

## 13. Validation Model

### 13.1 Required MVP Validation

Manual validation is required.

Each step state should support:

- Pending.
- Correct.
- Retry.
- Skipped, if allowed.

Each exercise summary should include:

- Steps completed.
- Steps retried.
- Steps skipped.
- Completion timestamp.

### 13.2 Optional Pitch Detection Validation

Pitch detection may be introduced behind a feature flag or capability gate.

Recommended browser APIs:

- `navigator.mediaDevices.getUserMedia`.
- Web Audio API.

Potential future detection approach:

- Single-note pitch estimation first.
- Chord detection only after reliable note detection.
- Tolerance for tuning deviation.
- Confidence threshold before marking a note correct.

Pitch detection must never silently override user intent. Manual validation remains available.

## 14. API Expectations

### 14.1 MVP API

The Express API remains limited to:

```http
GET /health
```

No MVP client feature should depend on additional API endpoints.

### 14.2 Future API Boundaries

Future phases may add endpoints for:

- Hosted lesson content.
- Content version manifests.
- User accounts.
- Synced progress.
- Analytics events.
- MIDI device metadata if useful.
- Song catalog and licensing metadata.

The MVP content schema should be designed so static bundled content can later be served through an API without rewriting practice UI components.

## 15. Recommended Client Module Structure

Recommended additions under `apps/client/src/`:

- `routes/`
  - `HomeRoute.tsx`
  - `LessonsRoute.tsx`
  - `PracticeRoute.tsx`
  - `LibraryRoute.tsx`
  - `ProgressRoute.tsx`
- `components/app/`
  - `AppShell.tsx`
  - `Navigation.tsx`
- `components/piano/`
  - `VirtualPiano.tsx`
  - `PianoKey.tsx`
  - `keyboardLayout.ts`
- `components/practice/`
  - `PracticeControls.tsx`
  - `PracticeInstruction.tsx`
  - `PracticeSummary.tsx`
  - `FingerGuide.tsx`
- `content/`
  - `types.ts`
  - `notes.ts`
  - `chords.ts`
  - `lessons.ts`
  - `exercises.ts`
  - `index.ts`
- `progress/`
  - `types.ts`
  - `storage.ts`
  - `useProgress.ts`
- `practice/`
  - `types.ts`
  - `practiceState.ts`
  - `validation.ts`
- `audio/`
  - `pitchDetection.ts`
  - `useMicrophonePermission.ts`

The `audio/` module is optional for MVP unless pitch detection is implemented as an enhancement.

## 16. State Management

The MVP should start with React state, custom hooks, and local storage helpers. Avoid adding Redux, Zustand, TanStack Query, or other state libraries unless requirements grow beyond local client state.

Recommended state boundaries:

- Static content: imported modules.
- Progress: local storage backed hook.
- Practice session: route-local state or reducer.
- Microphone state: isolated optional hook.

## 17. Accessibility Requirements

The MVP should support:

- Keyboard navigation for primary controls.
- Visible focus states.
- Buttons with clear accessible labels.
- Text alternatives for visual-only key states.
- Sufficient contrast for highlighted keys.
- Non-color-only feedback for correct, retry, skipped, and completed states.
- Reduced reliance on sound-only cues.

The virtual piano should expose enough semantic information for assistive technology, even if the visual keyboard is the primary learning interface.

## 18. Responsive and Device Requirements

Primary use case: phone or tablet placed on a real piano music stand.

Design implications:

- Large tap targets for practice controls.
- Current instruction visible at a glance.
- Avoid tiny dense controls during practice.
- Keep the keyboard stable during step changes.
- Avoid layout shifts when feedback text changes.
- Support portrait and landscape tablet use.
- Do not depend on hover.

## 19. Error and Empty States

Required states:

- No progress yet.
- Invalid exercise ID.
- Empty lesson group, if content is misconfigured.
- Local storage unavailable or blocked.
- Corrupt local progress data.
- Microphone unsupported.
- Microphone permission denied.
- Pitch detection low confidence, if implemented.

The app should recover gracefully and provide a clear next action.

## 20. Testing Strategy

### 20.1 Client Tests

Use Vitest and React Testing Library.

Recommended coverage:

- Route rendering for `/`, `/lessons`, `/practice/:exerciseId`, `/library`, `/progress`.
- Exercise lookup by valid and invalid ID.
- Virtual piano renders target highlighted keys.
- Finger numbers render for applicable steps.
- Manual validation advances practice state correctly.
- Retry keeps user on current step.
- Skip follows exercise rules.
- Exercise completion writes local progress.
- Progress route reads completed exercises.
- Corrupt local storage data does not crash app.

### 20.2 API Tests

Keep existing health check coverage. No new API behavior is required for MVP.

### 20.3 Content Tests

Static content should have lightweight validation tests:

- Exercise IDs are unique.
- Lesson IDs are unique.
- Every exercise references an existing lesson.
- Every step has at least one target note unless intentionally instructional.
- Required notes fit within configured keyboard range.
- Prerequisite exercise IDs exist.

## 21. Acceptance Criteria

The MVP implementation is complete when:

- All required routes exist and are navigable.
- Beginner lessons are loaded from static client content.
- A user can start and complete at least one exercise without sign-in.
- Practice shows a virtual piano with highlighted target keys.
- Practice shows hand and finger guidance when content provides it.
- Manual validation supports correct, retry, skip where allowed, and restart.
- Completion updates local progress.
- `/progress` reflects completed exercises, streak, and recent practice.
- App works without microphone permission.
- Invalid exercise IDs show a recoverable state.
- Local storage failures do not crash the app.
- Client tests cover the core practice and progress flow.
- API remains compatible with existing `GET /health`.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass before release.

## 22. Risks and Mitigations

### 22.1 Pitch Detection Reliability

Risk: Browser microphone pitch detection can be unreliable across devices, noisy rooms, tuning differences, and chords.

Mitigation: Make manual validation the required path. Treat pitch detection as optional and non-blocking.

### 22.2 Local Progress Loss

Risk: Users can lose progress if browser storage is cleared or they switch devices.

Mitigation: Clearly indicate that MVP progress is stored on this device. Defer synced accounts to future scope.

### 22.3 Static Content Updates

Risk: Bundled content requires redeploys for content changes.

Mitigation: Use stable content schemas and versioning so content can later move behind an API.

### 22.4 Mobile Usability

Risk: A virtual piano can become cramped on phone screens.

Mitigation: Use configurable keyboard ranges, horizontal scrolling if needed, large controls, and stable layouts.

### 22.5 Manual Validation Accuracy

Risk: Users may mark incorrect playing as correct.

Mitigation: Manual validation is acceptable for MVP because it preserves usability. Future pitch detection and MIDI can improve validation confidence.

## 23. Future Phases

### 23.1 Pitch Detection Phase

- Single-note detection.
- Calibration flow.
- Confidence thresholds.
- Tuning tolerance.
- Exercise-level audio validation.
- Chord detection after single-note validation is reliable.

### 23.2 MIDI Phase

- Web MIDI support.
- MIDI note-on and note-off validation.
- Accurate chord and timing validation.
- Device setup flow.

### 23.3 Accounts and Sync Phase

- Authentication.
- User profile.
- Cloud progress.
- Cross-device resume.
- Progress backup and restore.

### 23.4 Hosted Content Phase

- API-served lessons and exercises.
- Content version manifest.
- Admin or editorial workflow.
- Feature flags for new content.

### 23.5 Expanded Curriculum Phase

- Full songs.
- Advanced scales.
- Chord inversions.
- Arpeggios.
- Two-hand independence.
- Rhythm training.
- Sight-reading.

## 24. Implementation Checkpoints

Recommended build order:

1. Add route structure and app shell.
2. Define static content types and seed beginner exercises.
3. Build virtual piano rendering for exercise target notes.
4. Build practice state and manual validation flow.
5. Add local progress storage and progress route.
6. Add lessons and library views from the same content source.
7. Add resilience for invalid IDs, corrupt storage, and empty states.
8. Add focused tests for content integrity, practice flow, and progress persistence.
9. Optionally add microphone permission UI and pitch detection placeholder behind progressive enhancement.

## 25. Definition of Done

The MVP should be considered done only when a new user can open the app on a phone, tablet, or desktop browser; select a beginner exercise; follow visual key and finger guidance; complete the exercise through manual validation; and see progress saved locally without needing an account, microphone permission, or backend content service.
