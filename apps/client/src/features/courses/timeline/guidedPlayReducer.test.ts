import type { TimedNoteEvent } from "../courseTypes";
import {
  createGuidedPlayState,
  guidedPlayReducer,
  summarizeGuidedPlay
} from "./guidedPlayReducer";
import { scoreEventResult } from "./guidedPlayScoring";

const events: TimedNoteEvent[] = [
  { id: "perfect", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 1 },
  { id: "early", type: "note", notes: ["D4"], startBeat: 1, durationBeats: 1 },
  { id: "missed", type: "note", notes: ["E4"], startBeat: 2, durationBeats: 1 }
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
      score: 140,
      maxPossibleScore: 300,
      scorePercent: 140 / 300,
      perfectInputs: 1,
      earlyInputs: 1,
      missedInputs: 1,
      wrongInputs: 1,
      meanAbsoluteTimingErrorMs: 105
    });
  });
});
