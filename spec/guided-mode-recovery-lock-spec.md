# Guided Mode Recovery Lock Specification

## Status
Approved for implementation on `main`.

## Objective

Make Piano360 Guided Mode rhythm-aware without allowing learners to lose their place. Notes should still approach the keyboard at the intended musical time, but a missed or partially completed event must enter a recovery lock instead of scrolling past and allowing the lesson to continue.

The experience must help a learner progress from note recognition to correct continuous performance.

## Product Model

### Guided Mode

Guided Mode is learner-supportive and timing-aware.

1. Each event approaches the strike line at the intended musical tempo.
2. The learner receives the normal timing window and can earn the existing timing result: `perfect`, `good`, `early`, or `late`.
3. If the event is missed or only partially completed, the original timing result is recorded honestly.
4. The musical transport enters a recovery lock.
5. The failed event is pinned at the strike line and becomes the only active target.
6. The learner must complete the target correctly before the lesson continues.
7. Recovery completion is tracked separately from timing accuracy.
8. After recovery, show a brief 250–400 ms confirmation state.
9. Rebase the guided transport so the next unresolved event gets its full normal visual lead-in.
10. Already completed events must not replay.

### Performance Mode

Performance Mode remains continuous and time-led.

- No recovery lock.
- Notes continue scrolling.
- Misses remain misses.
- The learner must keep up with the song in real time.

## Core State Model

Manual pause and automatic recovery lock must be distinct states.

Recommended guided states:

- `idle`
- `count-in`
- `playing`
- `paused`
- `recovery`
- `recovery-confirmation`
- `completed`

Recovery target states:

- `waiting`
- `collecting-chord`
- `holding`
- `releasing`
- `completed`

## Timing and Scoring

### Normal timing attempt

The learner first receives the normal timing window.

- `perfect`, `good`, `early`, `late`: event can resolve normally.
- `missed`: timing result is preserved and recovery begins.
- `partial`: timing result is preserved and recovery begins.
- `wrong`: feedback is shown, but the active target does not change.

### Timing result versus mastery result

Track these separately.

Timing result:

- `perfect`
- `good`
- `early`
- `late`
- `missed`
- `partial`
- `wrong`

Recovery status:

- not required
- required
- completed

A recovered miss must still count as a timing miss in rhythm statistics.

## Recovery Lock Behavior

When recovery begins:

- pause the musical transport;
- pin the failed event at its strike position;
- stop falling-note motion;
- pause transport-driven metronome or accompaniment;
- keep direct piano sound available;
- highlight the required key or chord keys;
- dim future notes;
- show a clear `Waiting for you` recovery status;
- do not allow Play to bypass recovery;
- do not allow the active recovery target to be skipped in normal Guided Mode.

The recovery lock must remain until the target is successfully completed.

## Single Notes

For a single-note recovery:

1. Show `Play <NOTE>`.
2. Wrong notes give immediate feedback and do not advance.
3. Correct press begins the hold requirement.
4. The learner must hold for the event duration within the allowed release tolerance.
5. Correct release completes recovery.

## Sustained Notes

Long notes must be mechanically meaningful.

- A correct press starts the hold.
- The note remains visually attached to the strike line.
- The UI should show `Hold` while the duration is incomplete.
- When the required duration is reached, the UI may change to `Release`.
- Releasing too early records or preserves a `partial` timing result and resets the same event into recovery.
- Recovery requires a full press-hold-release retry.

## Repeated Notes

Repeated notes must remain separate events.

Example: `C4 -> C4` requires:

- press C4;
- release C4;
- press C4 again;
- release C4 again.

A continuous hold must not satisfy both events.

## Chords

A chord is one grouped event.

For `C4 + E4 + G4`:

- all required notes must be pressed within the accepted chord simultaneity window;
- note order does not matter;
- partial chord input must not advance;
- once formed, all required keys must remain held together for the event duration;
- releasing any required key too early fails the recovery attempt and resets the whole chord target;
- after the hold duration is satisfied, all required notes must be released to complete the event.

## Wrong Inputs

Wrong inputs must never change the active target.

During normal timing:

- show immediate feedback;
- keep the original target active while time remains.

During recovery:

- show `Wrong key — play <target>` or equivalent;
- briefly mark the incorrect key visually;
- keep the correct target highlighted;
- do not advance;
- preserve the existing wrong-input counting policy.

## Recovery Confirmation

After successful recovery:

- show a brief 250–400 ms success confirmation;
- flash the resolved key or chord;
- clear the recovery prompt;
- automatically continue without requiring another Play action.

Do not add this pause after normal in-time success.

## Lead-in Rebase

After recovery:

- find the next unresolved event;
- preserve already resolved events;
- resume from a musical position that gives the next unresolved event its full normal visual lead-in;
- do not use wall-clock time accumulated during recovery;
- do not allow the next target to jump close to the keyboard.

The exact lead-in distance should match the existing falling-note visual system rather than introduce a separate movement model.

## UI Requirements

### Strike line

- visually dominant interaction point;
- active recovery target pinned to it;
- stronger glow while waiting for input.

### Status area

Normal states:

- `Get ready`
- `Guided Play`
- normal timing feedback

Recovery states:

- `Waiting for you`
- `Play C4`
- `Play the full chord`
- `Complete the chord`
- `Hold`
- `Hold longer`
- `Release`

Manual pause:

- `Paused`

Manual pause must not be visually or behaviorally confused with recovery lock.

### Target emphasis

During recovery:

- required keyboard keys remain highlighted;
- active event remains prominent;
- future notes are visually de-emphasized;
- current target does not disappear.

## Completion and Progression

Guided Mode lesson completion requires every event to be mastered either:

- in time; or
- through successful recovery.

A learner may unlock the next lesson even if timing misses occurred, provided every missed or partial event was successfully recovered.

Recovery must not overwrite the original rhythm score.

Existing local progress persistence and lesson unlock behavior must remain intact.

## Architecture Constraints

- Reuse the existing timeline player.
- Do not build a second player.
- Reuse the existing transport, timing judge, falling-note stage, piano input pipeline, scoring, and progress system.
- Keep recovery logic deterministic.
- Keep screen, keyboard, and MIDI input on the same event-controller path.
- Do not alter course note content or timeline source material.
- Do not weaken schema validation.

## Acceptance Criteria

1. Guided events still receive normal timing windows.
2. Missed events do not scroll past indefinitely in Guided Mode.
3. A miss is recorded as `missed` before recovery begins.
4. A partial hold is recorded as `partial` before recovery begins.
5. Recovery lock freezes transport and falling-note motion.
6. The active recovery event is pinned at the strike line.
7. The correct key or chord remains highlighted.
8. Wrong input does not advance.
9. Single notes require correct press and release.
10. Long notes require a valid hold duration.
11. Early release requires retrying the same event.
12. Repeated notes require re-articulation.
13. Chords require the full group, full hold, and full release.
14. Recovery completion is tracked separately from timing accuracy.
15. Manual pause and recovery lock are distinct.
16. Play cannot bypass recovery.
17. Recovery targets cannot be skipped in normal Guided Mode.
18. Recovery success triggers only a short 250–400 ms confirmation pause.
19. The next unresolved event receives full normal lead-in after recovery.
20. Already completed events are not replayed.
21. Guided completion allows progression once all events are mastered.
22. Performance Mode remains continuous.
23. Existing progress persistence continues to work.
24. Automated tests cover the new behavior.
25. `npm test`, `npm run typecheck`, and `npm run build` pass before release.

## Out of Scope

- rewriting course note content;
- expanding commercial excerpts;
- replacing the timeline engine;
- moving progress to MongoDB;
- default skip controls for recovery targets;
- unrelated course-page redesign;
- changing Performance Mode into a learner-paced experience.
