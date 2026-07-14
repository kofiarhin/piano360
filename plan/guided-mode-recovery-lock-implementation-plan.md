# Guided Mode Recovery Lock Implementation Plan

## References

Primary specification:

- `spec/guided-mode-recovery-lock-spec.md`

Existing curriculum references:

- `docs/unified-falling-notes-curriculum-spec.md`
- `plan/unified-falling-notes-curriculum-implementation-plan.md`

## Objective

Implement a rhythm-aware Guided Mode that gives the learner a normal opportunity to play in time, but freezes and requires recovery when an event is missed or partially completed. Preserve continuous Performance Mode behavior.

## Phase 1 — Audit and Preserve Existing Contracts

Inspect and preserve:

- `TimelinePlayer`
- `useTimelineTransport`
- `TimelineClock`
- `timingJudge`
- `guidedPlayReducer`
- `guidedPlayScoring`
- `FallingNotesStage`
- `CoursePiano`
- `useTimelineInput`
- lesson progress persistence
- lesson completion rules
- current timing tests

Confirm that all input sources continue through one `NoteAttempt` path.

## Phase 2 — Add Explicit Recovery Domain State

Add a small pure recovery controller rather than embedding all recovery logic in React state.

Recommended state:

- recovery event id
- phase: waiting / collecting-chord / holding / releasing
- pressed required notes
- released required notes
- hold start timestamp
- recovery attempt count

Required pure operations:

- create recovery state
- press a note during recovery
- release a note during recovery
- reset failed recovery attempt
- determine completion
- calculate minimum hold duration from event duration, BPM, and timing tolerance

Keep recovery scoring separate from original timing scoring.

## Phase 3 — Make Guided Miss Expiry Lock One Event at a Time

Update missed-event expiry so Guided Mode can stop at the first unresolved failure instead of marking multiple future events missed in one frame.

Requirements:

- only the active unresolved event can trigger a recovery lock;
- once recovery begins, no future event can expire;
- pending chord and pending hold failure can trigger recovery;
- the original miss or partial result is recorded once;
- no duplicate scoring.

Preserve default continuous expiry behavior for flows that do not use recovery locking.

## Phase 4 — Integrate Recovery Lock Into TimelinePlayer

Add explicit local Guided Mode recovery state.

On miss or partial failure:

1. record the original event result;
2. identify the failed event;
3. pause transport;
4. seek to the failed event strike position;
5. enter recovery state;
6. keep the failed event as the active target;
7. stop future miss expiry.

During recovery:

- accept input even though transport is not playing;
- route input to the recovery controller;
- keep direct piano sound active;
- ignore normal timeline candidate matching;
- reject wrong inputs without changing target;
- block Play from bypassing recovery.

## Phase 5 — Implement Recovery Semantics

### Single note

- correct press starts hold;
- release before minimum duration resets recovery and shows `Hold longer`;
- valid release completes recovery.

### Long note

- same as single note, using event duration in milliseconds;
- expose `Hold` then `Release` feedback.

### Repeated note

- recovery completion requires release;
- next repeated event remains a separate target;
- continuous hold cannot satisfy the next event.

### Chord

- collect all required notes;
- order-independent matching;
- wrong notes do not advance;
- all required notes must be held together;
- any early required-note release resets the full chord recovery;
- after hold duration is satisfied, require all required notes to be released before completion.

## Phase 6 — Add Recovery Completion Tracking

Extend guided play state with recovery metadata separate from `resultsByEventId`.

Recommended structure:

- `recoveredEventIds`
- optional recovery attempt count by event

Rules:

- original `missed` or `partial` result remains unchanged;
- recovery completion does not add timing points;
- completion eligibility treats recovered failed events as mastered;
- summary timing metrics remain based on original timing results.

## Phase 7 — Rebase Lead-in After Recovery

After recovery completes:

1. show a 250–400 ms confirmation state;
2. find the next unresolved event;
3. compute a safe resume beat that gives the next event normal visual approach time;
4. seek transport to that resume beat;
5. clear recovery state;
6. resume automatically.

Use existing visual lead-in behavior as the source of truth. Do not invent a second note-motion model.

Already resolved events must remain resolved and must not replay.

## Phase 8 — UI State and Visual Synchronization

Update status UI to distinguish:

- count-in
- guided play
- manual pause
- recovery lock
- recovery confirmation
- complete

Recovery copy:

- `Waiting for you`
- `Play <note>`
- `Play the full chord`
- `Complete the chord`
- `Hold`
- `Hold longer`
- `Release`

Update falling-note visuals:

- active recovery target remains pinned at strike line;
- future notes are dimmed during recovery;
- strike line receives stronger recovery emphasis;
- target event remains visually dominant.

Keep keyboard target highlighting active throughout recovery.

## Phase 9 — Preserve Manual Pause and Performance Semantics

Manual pause:

- no scoring progression;
- no recovery bypass;
- Resume works only when not recovery-locked.

Recovery lock:

- automatic;
- cannot be bypassed by Play;
- only target completion, Restart, or Exit resolves the flow.

Performance Mode:

- remains continuous;
- does not use recovery lock;
- keeps normal miss expiry.

Where the current player does not yet expose a runtime practice-mode toggle, gate recovery behavior using existing lesson behavior such as `pauseOnMiss`, preserving non-pausing behavior for timelines configured otherwise.

## Phase 10 — Completion and Progression

Update completion eligibility so Guided Mode completes when every event is either:

- successfully resolved in time; or
- failed in time but later recovered successfully.

Do not require a perfect rhythm score to unlock progression.

Preserve:

- local progress storage
- next lesson unlocking
- restart behavior
- final lesson completion

## Phase 11 — Automated Test Coverage

Add pure recovery-controller tests for:

- single-note recovery
- wrong note rejection
- early release reset
- correct long-note hold
- repeated-note re-articulation
- partial chord collection
- early chord release reset
- full chord hold and release

Add timing-judge tests for:

- first-failure-only guided expiry
- no duplicate results
- pending hold expiry
- pending chord expiry

Add TimelinePlayer tests for:

- miss enters recovery lock
- transport pauses and target remains active
- Play cannot bypass recovery
- recovery input works while transport is paused
- original miss remains in score
- recovered event is tracked separately
- short confirmation state
- automatic resume
- next event receives lead-in
- manual pause remains distinct
- wrong input does not advance
- long-note recovery
- chord recovery
- lesson completion after all failures are recovered

Add visual tests for:

- recovery target pinned at strike line
- future notes dimmed
- `Waiting for you` status
- highlighted target keys remain active

## Phase 12 — Validation

Run targeted tests first, then full validation:

```bash
npm test
npm run typecheck
npm run build
```

Do not claim success for commands that were not actually run.

## Definition of Done

- Guided Mode still teaches real timing.
- Missed or partial events cannot simply scroll away.
- Recovery lock freezes the shared musical clock.
- The active event stays visually aligned with the keyboard.
- Timing result and recovery mastery are separate.
- Long notes require correct hold and release.
- Chords require complete formation, hold, and release.
- Wrong notes never advance.
- Recovery cannot be bypassed with Play.
- The next event gets full lead-in after recovery.
- Manual Pause remains distinct.
- Performance behavior remains continuous where configured.
- Existing progress and unlocking continue to work.
- Tests, typecheck, and build pass before release.
