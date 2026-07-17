import type { TimedNoteEvent } from "../courseTypes";
import {
  applyGuidedStopWaitPress,
  applyGuidedStopWaitRelease,
  calculateStopWaitApproachToleranceBeats,
  createGuidedStopWaitState,
  lockGuidedStopWaitEvent,
  nextUncompletedEvent,
  resolveGuidedStopWaitApproachingPress,
  startGuidedStopWaitApproach,
} from "./guidedStopWait";

const events: TimedNoteEvent[] = [
  {
    id: "first-c",
    type: "note",
    notes: ["C4"],
    startBeat: 1,
    durationBeats: 0.5,
  },
  {
    id: "second-c",
    type: "note",
    notes: ["C4"],
    startBeat: 3,
    durationBeats: 0.5,
  },
  { id: "d", type: "note", notes: ["D4"], startBeat: 5, durationBeats: 2 },
  {
    id: "c-major",
    type: "note",
    notes: ["C4", "E4", "G4"],
    startBeat: 8,
    durationBeats: 1,
  },
  {
    id: "c-f-g",
    type: "note",
    notes: ["C4", "F4", "G4"],
    startBeat: 10,
    durationBeats: 1,
  },
];

describe("guided stop-and-wait controller", () => {
  it("accepts a correct press at the strike line while still approaching", () => {
    const approaching = startGuidedStopWaitApproach(
      createGuidedStopWaitState(events),
      events[0],
    );
    const resolved = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat,
      toleranceBeats: calculateStopWaitApproachToleranceBeats(60),
    });

    expect(resolved).toMatchObject({
      type: "ready",
      state: { phase: "waiting-for-input", lockedBeat: events[0].startBeat },
    });

    const pressed = applyGuidedStopWaitPress(resolved.state, events[0], "C4");
    expect(pressed).toMatchObject({
      type: "completed",
      state: { completedEventIds: ["first-c"] },
    });
  });

  it("accepts one frame before lock and one frame after lock from musical press time", () => {
    const toleranceBeats = calculateStopWaitApproachToleranceBeats(60);
    const oneFrameBeats = 16 / 1000;
    const approaching = startGuidedStopWaitApproach(
      createGuidedStopWaitState(events),
      events[0],
    );

    const justEarly = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat - oneFrameBeats,
      toleranceBeats,
    });
    const justLate = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat + oneFrameBeats,
      toleranceBeats,
    });

    expect(justEarly.type).toBe("ready");
    expect(justLate.type).toBe("ready");
  });

  it("keeps too-early boundary presses from locking the event", () => {
    const approaching = startGuidedStopWaitApproach(
      createGuidedStopWaitState(events),
      events[0],
    );
    const resolved = resolveGuidedStopWaitApproachingPress({
      state: approaching,
      event: events[0],
      pressBeat: events[0].startBeat - 0.5,
      toleranceBeats: calculateStopWaitApproachToleranceBeats(60),
    });

    expect(resolved).toMatchObject({ type: "too-early", state: approaching });
  });

  it("rejects wrong notes without changing the active target", () => {
    const locked = lockGuidedStopWaitEvent(
      createGuidedStopWaitState(events),
      events[0],
    );
    const wrong = applyGuidedStopWaitPress(locked, events[0], "D4");

    expect(wrong).toMatchObject({
      type: "wrong",
      state: {
        activeEventId: "first-c",
        phase: "waiting-for-input",
        completedEventIds: [],
        wrongNoteCount: 1,
      },
    });
  });

  it("completes single notes on press regardless of authored duration", () => {
    const locked = lockGuidedStopWaitEvent(
      createGuidedStopWaitState(events),
      events[2],
    );
    const pressed = applyGuidedStopWaitPress(locked, events[2], "D4");

    expect(pressed).toMatchObject({
      type: "completed",
      state: { completedEventIds: ["d"] },
    });
  });

  it("collects chord notes in any order and completes on the final press", () => {
    let state = lockGuidedStopWaitEvent(
      createGuidedStopWaitState(events),
      events[3],
    );

    const first = applyGuidedStopWaitPress(state, events[3], "G4");
    expect(first).toMatchObject({
      type: "progress",
      state: { phase: "collecting-chord", pressedTargetNotes: ["G4"] },
      label: "Add C4 and E4",
    });

    state = applyGuidedStopWaitPress(first.state, events[3], "C4").state;
    const completed = applyGuidedStopWaitPress(state, events[3], "E4");

    expect(completed).toMatchObject({
      type: "completed",
      state: { completedEventIds: ["c-major"] },
    });
  });

  it("removes a released partial chord note before completion", () => {
    let state = lockGuidedStopWaitEvent(
      createGuidedStopWaitState(events),
      events[3],
    );
    state = applyGuidedStopWaitPress(state, events[3], "C4").state;
    state = applyGuidedStopWaitPress(state, events[3], "E4").state;

    const released = applyGuidedStopWaitRelease(state, events[3], "E4");

    expect(released).toMatchObject({
      type: "progress",
      state: {
        phase: "collecting-chord",
        activeNotes: ["C4"],
        pressedTargetNotes: ["C4"],
      },
    });
  });

  it("blocks a repeated note until the held key is released and pressed again", () => {
    const firstLocked = lockGuidedStopWaitEvent(
      createGuidedStopWaitState(events),
      events[0],
    );
    const firstCompleted = applyGuidedStopWaitPress(
      firstLocked,
      events[0],
      "C4",
    );
    const nextEvent = nextUncompletedEvent(
      events,
      firstCompleted.state.completedEventIds,
    );

    expect(nextEvent?.id).toBe("second-c");

    const approaching = startGuidedStopWaitApproach(
      firstCompleted.state,
      events[1],
      ["C4"],
    );
    const locked = lockGuidedStopWaitEvent(approaching, events[1], ["C4"]);
    const heldPress = applyGuidedStopWaitPress(locked, events[1], "C4");

    expect(heldPress).toMatchObject({
      type: "ignored",
      state: { completedEventIds: ["first-c"], blockedNotes: ["C4"] },
    });

    const released = applyGuidedStopWaitRelease(
      heldPress.state,
      events[1],
      "C4",
    );
    expect(released.state.blockedNotes).toEqual([]);

    const freshPress = applyGuidedStopWaitPress(
      released.state,
      events[1],
      "C4",
    );
    expect(freshPress).toMatchObject({
      type: "completed",
      state: { completedEventIds: ["first-c", "second-c"] },
    });
  });

  it("requires fresh presses for notes carried into an overlapping chord", () => {
    const approaching = startGuidedStopWaitApproach(
      createGuidedStopWaitState(events),
      events[4],
      ["C4", "G4"],
    );
    let state = lockGuidedStopWaitEvent(approaching, events[4], ["C4", "G4"]);

    state = applyGuidedStopWaitPress(state, events[4], "F4").state;
    expect(state).toMatchObject({
      phase: "collecting-chord",
      blockedNotes: ["C4", "G4"],
      pressedTargetNotes: ["F4"],
    });

    state = applyGuidedStopWaitRelease(state, events[4], "C4").state;
    state = applyGuidedStopWaitPress(state, events[4], "C4").state;
    state = applyGuidedStopWaitRelease(state, events[4], "G4").state;
    const completed = applyGuidedStopWaitPress(state, events[4], "G4");

    expect(completed).toMatchObject({
      type: "completed",
      state: { completedEventIds: ["c-f-g"] },
    });
  });
});
