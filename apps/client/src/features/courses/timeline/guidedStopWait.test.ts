import type { TimedNoteEvent } from "../courseTypes";
import {
  applyGuidedStopWaitPress,
  applyGuidedStopWaitRelease,
  calculateStopWaitApproachToleranceBeats,
  completeGuidedStopWaitHold,
  createGuidedStopWaitState,
  lockGuidedStopWaitEvent,
  minimumStopWaitHoldMilliseconds,
  nextUncompletedEvent,
  resolveGuidedStopWaitApproachingPress,
  startGuidedStopWaitApproach
} from "./guidedStopWait";
import { DEFAULT_TIMING_WINDOWS } from "./timingJudge";

const events: TimedNoteEvent[] = [
  { id: "first-c", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 0.5 },
  { id: "second-c", type: "note", notes: ["C4"], startBeat: 3, durationBeats: 0.5 },
  { id: "long-d", type: "note", notes: ["D4"], startBeat: 5, durationBeats: 2 },
  { id: "c-major", type: "note", notes: ["C4", "E4", "G4"], startBeat: 8, durationBeats: 1 }
];

describe("guided stop-and-wait controller", () => {
  it("accepts a correct press at the strike line while still approaching", () => {
    const approaching = startGuidedStopWaitApproach(createGuidedStopWaitState(events), events[0]);
    const resolved = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat,
      toleranceBeats: calculateStopWaitApproachToleranceBeats(60)
    });

    expect(resolved).toMatchObject({
      type: "ready",
      state: { phase: "waiting-for-input", lockedBeat: events[0].startBeat }
    });

    const pressed = applyGuidedStopWaitPress(resolved.state, events[0], "C4", 1000);
    expect(pressed).toMatchObject({ type: "progress", state: { phase: "holding" } });
  });

  it("accepts one frame before lock and one frame after lock from musical press time", () => {
    const toleranceBeats = calculateStopWaitApproachToleranceBeats(60);
    const oneFrameBeats = 16 / 1000;
    const approaching = startGuidedStopWaitApproach(createGuidedStopWaitState(events), events[0]);

    const justEarly = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat - oneFrameBeats,
      toleranceBeats
    });
    const justLate = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat + oneFrameBeats,
      toleranceBeats
    });

    expect(justEarly.type).toBe("ready");
    expect(justLate.type).toBe("ready");
  });

  it("keeps too-early boundary presses from locking the event", () => {
    const approaching = startGuidedStopWaitApproach(createGuidedStopWaitState(events), events[0]);
    const resolved = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat - 0.5,
      toleranceBeats: calculateStopWaitApproachToleranceBeats(60)
    });

    expect(resolved).toMatchObject({ type: "too-early", state: approaching });
  });

  it("does not let a boundary press target a future event", () => {
    const approaching = startGuidedStopWaitApproach(createGuidedStopWaitState(events), events[0]);
    const resolved = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[1],
      pressBeat: events[1].startBeat,
      toleranceBeats: calculateStopWaitApproachToleranceBeats(60)
    });

    expect(resolved).toMatchObject({ type: "ignored", state: approaching });
  });

  it("keeps wrong near-boundary notes wrong after the synchronous lock", () => {
    const approaching = startGuidedStopWaitApproach(createGuidedStopWaitState(events), events[0]);
    const resolved = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat,
      toleranceBeats: calculateStopWaitApproachToleranceBeats(60)
    });
    const wrong = applyGuidedStopWaitPress(resolved.state, events[0], "D4", 1000);

    expect(wrong).toMatchObject({
      type: "wrong",
      state: { activeEventId: "first-c", phase: "waiting-for-input", completedEventIds: [] }
    });
  });

  it("moves from holding to waiting-for-release when the hold threshold is reached", () => {
    const locked = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[0]);
    const pressed = applyGuidedStopWaitPress(locked, events[0], "C4", 1000);
    const ready = completeGuidedStopWaitHold(
      pressed.state,
      events[0],
      1250,
      60,
      DEFAULT_TIMING_WINDOWS
    );

    expect(ready).toMatchObject({
      phase: "waiting-for-release",
      feedback: "Release",
      holdProgress: 1
    });
  });

  it("reports derived hold progress before release readiness", () => {
    const locked = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[2]);
    const pressed = applyGuidedStopWaitPress(locked, events[2], "D4", 1000);
    const updated = completeGuidedStopWaitHold(
      pressed.state,
      events[2],
      1400,
      60,
      DEFAULT_TIMING_WINDOWS
    );

    expect(updated.phase).toBe("holding");
    expect(updated.holdProgress).toBeGreaterThan(0);
    expect(updated.holdProgress).toBeLessThan(1);
  });

  it("uses responsive stop-and-wait hold pacing for short notes at slow tempos", () => {
    expect(minimumStopWaitHoldMilliseconds(events[0], 60, DEFAULT_TIMING_WINDOWS)).toBe(175);
    expect(minimumStopWaitHoldMilliseconds(events[0], 30, DEFAULT_TIMING_WINDOWS)).toBe(250);
    expect(minimumStopWaitHoldMilliseconds(events[2], 60, DEFAULT_TIMING_WINDOWS)).toBeGreaterThan(
      minimumStopWaitHoldMilliseconds(events[0], 60, DEFAULT_TIMING_WINDOWS)
    );
  });

  it("locks one active event at the strike line before accepting input", () => {
    const initialized = createGuidedStopWaitState(events);
    const approaching = startGuidedStopWaitApproach(initialized, events[0]);
    const locked = lockGuidedStopWaitEvent(approaching, events[0]);

    expect(locked).toMatchObject({
      activeEventId: "first-c",
      phase: "waiting-for-input",
      lockedBeat: 1,
      requiredNotes: ["C4"],
      completedEventIds: []
    });
  });

  it("rejects wrong notes without changing the active target", () => {
    const locked = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[0]);
    const wrong = applyGuidedStopWaitPress(locked, events[0], "D4", 1000);

    expect(wrong).toMatchObject({
      type: "wrong",
      state: {
        activeEventId: "first-c",
        phase: "waiting-for-input",
        completedEventIds: [],
        wrongNoteCount: 1
      }
    });
  });

  it("requires press and release before a short note completes", () => {
    const locked = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[0]);
    const pressed = applyGuidedStopWaitPress(locked, events[0], "C4", 1000);

    expect(pressed).toMatchObject({ type: "progress", state: { phase: "holding" } });
    expect(pressed.state.completedEventIds).toEqual([]);

    const released = applyGuidedStopWaitRelease(
      pressed.state,
      events[0],
      "C4",
      1400,
      60,
      DEFAULT_TIMING_WINDOWS,
      320
    );

    expect(released).toMatchObject({
      type: "completed",
      state: { phase: "success-confirmation", completedEventIds: ["first-c"] }
    });
  });

  it("resets a long note when it is released too early", () => {
    const locked = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[2]);
    const pressed = applyGuidedStopWaitPress(locked, events[2], "D4", 1000);
    const releasedEarly = applyGuidedStopWaitRelease(
      pressed.state,
      events[2],
      "D4",
      1300,
      60,
      DEFAULT_TIMING_WINDOWS,
      320
    );

    expect(releasedEarly).toMatchObject({
      type: "retry",
      label: "Hold longer",
      state: {
        activeEventId: "long-d",
        phase: "waiting-for-input",
        completedEventIds: [],
        retryCountByEventId: { "long-d": 1 }
      }
    });
  });

  it("keeps repeated notes as separate events that require re-articulation", () => {
    const firstLocked = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[0]);
    const firstPressed = applyGuidedStopWaitPress(firstLocked, events[0], "C4", 1000);
    const firstReleased = applyGuidedStopWaitRelease(
      firstPressed.state,
      events[0],
      "C4",
      1400,
      60,
      DEFAULT_TIMING_WINDOWS,
      320
    );

    expect(nextUncompletedEvent(events, firstReleased.state.completedEventIds)?.id).toBe(
      "second-c"
    );

    const secondLocked = lockGuidedStopWaitEvent(firstReleased.state, events[1]);
    expect(secondLocked.phase).toBe("waiting-for-input");
    expect(secondLocked.pressedTargetNotes).toEqual([]);
  });

  it("collects chord notes in any order and requires full release", () => {
    let state = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[3]);
    state = applyGuidedStopWaitPress(state, events[3], "G4", 1000).state;
    expect(state).toMatchObject({
      phase: "collecting-chord",
      pressedTargetNotes: ["G4"],
      feedback: "Add C4 and E4"
    });

    state = applyGuidedStopWaitPress(state, events[3], "C4", 1030).state;
    state = applyGuidedStopWaitPress(state, events[3], "E4", 1060).state;
    expect(state.phase).toBe("holding");

    const releaseC = applyGuidedStopWaitRelease(
      state,
      events[3],
      "C4",
      1840,
      60,
      DEFAULT_TIMING_WINDOWS,
      320
    );
    expect(releaseC).toMatchObject({ type: "progress", state: { phase: "waiting-for-release" } });

    const releaseG = applyGuidedStopWaitRelease(
      releaseC.state,
      events[3],
      "G4",
      1860,
      60,
      DEFAULT_TIMING_WINDOWS,
      320
    );
    const releaseE = applyGuidedStopWaitRelease(
      releaseG.state,
      events[3],
      "E4",
      1880,
      60,
      DEFAULT_TIMING_WINDOWS,
      320
    );

    expect(releaseE).toMatchObject({
      type: "completed",
      state: { completedEventIds: ["c-major"] }
    });
  });

  it("resets the whole chord when one required note is released early", () => {
    let state = lockGuidedStopWaitEvent(createGuidedStopWaitState(events), events[3]);
    state = applyGuidedStopWaitPress(state, events[3], "C4", 1000).state;
    state = applyGuidedStopWaitPress(state, events[3], "E4", 1030).state;
    state = applyGuidedStopWaitPress(state, events[3], "G4", 1060).state;

    const earlyRelease = applyGuidedStopWaitRelease(
      state,
      events[3],
      "E4",
      1200,
      60,
      DEFAULT_TIMING_WINDOWS,
      320
    );

    expect(earlyRelease).toMatchObject({
      type: "retry",
      state: {
        phase: "waiting-for-input",
        activeEventId: "c-major",
        pressedTargetNotes: [],
        activeNotes: [],
        retryCountByEventId: { "c-major": 1 }
      }
    });
  });
});
