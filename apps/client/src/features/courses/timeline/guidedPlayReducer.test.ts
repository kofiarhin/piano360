import type { TimedNoteEvent } from "../courseTypes";
import {
  createGuidedPlayState,
  guidedPlayReducer,
  isGuidedPlayCompletionEligible,
  summarizeGuidedPlay
} from "./guidedPlayReducer";
import { scoreEventResult } from "./guidedPlayScoring";

const events: TimedNoteEvent[] = [
  { id: "perfect", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 1 },
  { id: "early", type: "note", notes: ["D4"], startBeat: 1, durationBeats: 1 },
  { id: "partial", type: "note", notes: ["E4", "G4"], startBeat: 2, durationBeats: 1 },
  { id: "missed", type: "note", notes: ["E4"], startBeat: 3, durationBeats: 1 }
];

describe("guidedPlayReducer", () => {
  it("adds points and tracks combo only for perfect and good results", () => {
    let state = createGuidedPlayState();
    state = guidedPlayReducer(state, {
      type: "event-result",
      result: scoreEventResult({
        eventId: "perfect",
        classification: "perfect",
        deltaMs: 10,
        playedNotes: ["C4"]
      })
    });
    state = guidedPlayReducer(state, {
      type: "event-result",
      result: scoreEventResult({
        eventId: "early",
        classification: "early",
        deltaMs: -220,
        playedNotes: ["D4"]
      })
    });

    expect(state.score).toBe(140);
    expect(state.combo).toBe(0);
    expect(state.maxCombo).toBe(1);
  });

  it("keeps wrong input score-neutral and resets gameplay on restart", () => {
    let state = createGuidedPlayState();
    state = guidedPlayReducer(state, {
      type: "wrong-input",
      feedback: { classification: "wrong", label: "Wrong note" }
    });
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.wrongInputCount).toBe(1);

    state = guidedPlayReducer(state, { type: "restart" });
    expect(state).toMatchObject({
      score: 0,
      combo: 0,
      wrongInputCount: 0,
      restartCount: 1,
      resultsByEventId: {}
    });
  });

  it("summarizes point totals and timing counts", () => {
    let state = createGuidedPlayState();
    for (const result of [
      scoreEventResult({
        eventId: "perfect",
        classification: "perfect",
        deltaMs: 10,
        playedNotes: ["C4"]
      }),
      scoreEventResult({
        eventId: "early",
        classification: "early",
        deltaMs: -200,
        playedNotes: ["D4"]
      }),
      scoreEventResult({
        eventId: "partial",
        classification: "partial",
        deltaMs: 251,
        playedNotes: ["E4"]
      }),
      scoreEventResult({
        eventId: "missed",
        classification: "missed",
        deltaMs: 260,
        playedNotes: []
      })
    ]) {
      state = guidedPlayReducer(state, { type: "event-result", result });
    }
    state = guidedPlayReducer(state, {
      type: "wrong-input",
      feedback: { classification: "wrong", label: "Wrong note" }
    });

    expect(summarizeGuidedPlay(state, events, 3000)).toMatchObject({
      score: 160,
      maxPossibleScore: 400,
      scorePercent: 160 / 400,
      fullyCorrectInputs: 2,
      incorrectInputs: 2,
      eventAccuracy: 2 / 4,
      perfectInputs: 1,
      earlyInputs: 1,
      partialInputs: 1,
      missedInputs: 1,
      wrongInputs: 1,
      meanAbsoluteTimingErrorMs: (10 + 200 + 251) / 3
    });
  });

  it("does not apply duplicate event results twice", () => {
    const result = scoreEventResult({
      eventId: "perfect",
      classification: "perfect",
      deltaMs: 0,
      playedNotes: ["C4"]
    });

    let state = guidedPlayReducer(createGuidedPlayState(), { type: "event-result", result });
    state = guidedPlayReducer(state, { type: "event-result", result });

    expect(state.score).toBe(100);
    expect(state.combo).toBe(1);
    expect(Object.keys(state.resultsByEventId)).toEqual(["perfect"]);
  });

  it("requires all events finalized, no pending chord, and the completion boundary", () => {
    expect(
      isGuidedPlayCompletionEligible({
        events: [events[0]],
        judgeState: { judgedEventIds: ["perfect"] },
        currentBeat: 0.5,
        totalBeats: 1
      })
    ).toBe(false);
    expect(
      isGuidedPlayCompletionEligible({
        events: [events[0]],
        judgeState: {
          judgedEventIds: ["perfect"],
          pendingChord: { eventId: "partial", playedNotes: ["E4"], attempts: [] }
        },
        currentBeat: 1,
        totalBeats: 1
      })
    ).toBe(false);
    expect(
      isGuidedPlayCompletionEligible({
        events: [events[0]],
        judgeState: { judgedEventIds: ["perfect"] },
        currentBeat: 1,
        totalBeats: 1
      })
    ).toBe(true);
  });
});
