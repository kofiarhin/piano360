import type { TimedNoteEvent } from "../courseTypes";
import {
  applyGuidedRecoveryPress,
  applyGuidedRecoveryRelease,
  createGuidedRecoveryState
} from "./guidedRecovery";
import { DEFAULT_TIMING_WINDOWS } from "./timingJudge";

const single: TimedNoteEvent = {
  id: "single-c",
  type: "note",
  notes: ["C4"],
  startBeat: 1,
  durationBeats: 1
};

const chord: TimedNoteEvent = {
  id: "c-major",
  type: "note",
  notes: ["C4", "E4", "G4"],
  startBeat: 2,
  durationBeats: 1
};

describe("guided recovery controller", () => {
  it("keeps the active target unchanged after a wrong note", () => {
    const state = createGuidedRecoveryState(single.id);
    const outcome = applyGuidedRecoveryPress(state, single, "D4", 1000);

    expect(outcome.type).toBe("wrong");
    expect(outcome.state).toEqual(state);
  });

  it("requires a single note to be held long enough before release", () => {
    const state = createGuidedRecoveryState(single.id);
    const pressed = applyGuidedRecoveryPress(state, single, "C4", 1000);
    expect(pressed.type).toBe("progress");

    const early = applyGuidedRecoveryRelease(
      pressed.state,
      single,
      "C4",
      1100,
      120,
      DEFAULT_TIMING_WINDOWS
    );
    expect(early.type).toBe("retry");
    expect(early.state.phase).toBe("waiting");

    const retried = applyGuidedRecoveryPress(early.state, single, "C4", 2000);
    const completed = applyGuidedRecoveryRelease(
      retried.state,
      single,
      "C4",
      2500,
      120,
      DEFAULT_TIMING_WINDOWS
    );
    expect(completed.type).toBe("completed");
  });

  it("collects a full chord before starting the hold", () => {
    const state = createGuidedRecoveryState(chord.id);
    const c = applyGuidedRecoveryPress(state, chord, "C4", 1000);
    expect(c.type).toBe("progress");
    expect(c.state.phase).toBe("collecting-chord");

    const e = applyGuidedRecoveryPress(c.state, chord, "E4", 1020);
    expect(e.state.phase).toBe("collecting-chord");

    const g = applyGuidedRecoveryPress(e.state, chord, "G4", 1040);
    expect(g.state.phase).toBe("holding");
    expect(g.state.pressedNotes).toEqual(["C4", "E4", "G4"]);
  });

  it("resets the full chord when any required note is released too early", () => {
    let state = createGuidedRecoveryState(chord.id);
    state = applyGuidedRecoveryPress(state, chord, "C4", 1000).state;
    state = applyGuidedRecoveryPress(state, chord, "E4", 1020).state;
    state = applyGuidedRecoveryPress(state, chord, "G4", 1040).state;

    const earlyRelease = applyGuidedRecoveryRelease(
      state,
      chord,
      "C4",
      1100,
      120,
      DEFAULT_TIMING_WINDOWS
    );

    expect(earlyRelease.type).toBe("retry");
    expect(earlyRelease.state).toEqual(createGuidedRecoveryState(chord.id));
  });

  it("requires all chord notes to be released after a valid hold", () => {
    let state = createGuidedRecoveryState(chord.id);
    state = applyGuidedRecoveryPress(state, chord, "C4", 1000).state;
    state = applyGuidedRecoveryPress(state, chord, "E4", 1020).state;
    state = applyGuidedRecoveryPress(state, chord, "G4", 1040).state;

    const releaseC = applyGuidedRecoveryRelease(
      state,
      chord,
      "C4",
      1540,
      120,
      DEFAULT_TIMING_WINDOWS
    );
    expect(releaseC.type).toBe("progress");
    expect(releaseC.state.phase).toBe("releasing");

    const releaseE = applyGuidedRecoveryRelease(
      releaseC.state,
      chord,
      "E4",
      1560,
      120,
      DEFAULT_TIMING_WINDOWS
    );
    expect(releaseE.type).toBe("progress");

    const releaseG = applyGuidedRecoveryRelease(
      releaseE.state,
      chord,
      "G4",
      1580,
      120,
      DEFAULT_TIMING_WINDOWS
    );
    expect(releaseG.type).toBe("completed");
  });
});
