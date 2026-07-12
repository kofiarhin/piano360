import type { TimedNoteEvent } from "../courseTypes";
import { createTimelineJudgeState, expireMissedEvents, judgeTimelineInput } from "./timingJudge";

const events: TimedNoteEvent[] = [
  { id: "first-c", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 1 },
  { id: "second-c", type: "note", notes: ["C4"], startBeat: 2, durationBeats: 1 },
  {
    id: "chord",
    type: "note",
    notes: ["C4", "E4", "G4"],
    startBeat: 4,
    durationBeats: 1
  }
];

describe("timeline input judgement", () => {
  it("matches repeated pitches to distinct nearby event ids", () => {
    const first = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 510, 120);
    const second = judgeTimelineInput(first.state, events, "C4", 1020, 120);

    expect(first.result).toMatchObject({
      eventId: "first-c",
      classification: "perfect",
      deltaMs: 10
    });
    expect(second.result).toMatchObject({
      eventId: "second-c",
      classification: "perfect",
      deltaMs: 20
    });
  });

  it("records early and late raw timing deltas", () => {
    const early = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 350, 120);
    const late = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 720, 120);

    expect(early.result).toMatchObject({ classification: "good", deltaMs: -150 });
    expect(late.result).toMatchObject({ classification: "accepted", deltaMs: 220 });
  });

  it("collects a chord and scores it once", () => {
    const first = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 2000, 120);
    const second = judgeTimelineInput(first.state, events, "E4", 2040, 120);
    const third = judgeTimelineInput(second.state, events, "G4", 2080, 120);

    expect(first.result).toBeUndefined();
    expect(second.result).toBeUndefined();
    expect(third.result).toMatchObject({ eventId: "chord", classification: "perfect" });
    expect(third.state.judgedEventIds).toContain("chord");
  });

  it("marks passed events missed without consuming later inputs", () => {
    const missed = expireMissedEvents(createTimelineJudgeState(), events, 800, 120);
    const next = judgeTimelineInput(missed.state, events, "C4", 1010, 120);

    expect(missed.results.map((result) => result.eventId)).toEqual(["first-c"]);
    expect(next.result?.eventId).toBe("second-c");
  });

  it("reports a wrong pitch near an expected event", () => {
    const judged = judgeTimelineInput(createTimelineJudgeState(), events, "F4", 500, 120);

    expect(judged.result).toMatchObject({ eventId: "first-c", classification: "wrong" });
  });
});
