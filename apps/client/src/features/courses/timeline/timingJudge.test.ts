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
    const early = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 260, 120);
    const late = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 720, 120);

    expect(early.result).toMatchObject({ classification: "early", deltaMs: -240, points: 40 });
    expect(late.result).toMatchObject({ classification: "late", deltaMs: 220, points: 40 });
  });

  it("classifies inclusive timing boundaries", () => {
    const expected = [
      [-250, "early"],
      [-160, "good"],
      [-80, "perfect"],
      [0, "perfect"],
      [80, "perfect"],
      [160, "good"],
      [250, "late"]
    ] as const;

    for (const [delta, classification] of expected) {
      const judged = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 500 + delta, 120);
      expect(judged.result).toMatchObject({ classification, deltaMs: delta });
    }
  });

  it("collects a chord in any order and scores it by least accurate note", () => {
    const first = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 2000, 120);
    const second = judgeTimelineInput(first.state, events, "G4", 2040, 120);
    const duplicate = judgeTimelineInput(second.state, events, "G4", 2060, 120);
    const third = judgeTimelineInput(duplicate.state, events, "E4", 2161, 120);

    expect(first.result).toBeUndefined();
    expect(second.result).toBeUndefined();
    expect(duplicate.result).toBeUndefined();
    expect(third.result).toMatchObject({
      eventId: "chord",
      classification: "late",
      deltaMs: 161,
      playedNotes: ["C4", "G4", "E4"]
    });
    expect(third.state.judgedEventIds).toContain("chord");
  });

  it("expires incomplete chords as partial and untouched chords as missed", () => {
    const partial = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 2000, 120);
    const expiredPartial = expireMissedEvents(partial.state, events, 2251, 120);
    const expiredMissed = expireMissedEvents(createTimelineJudgeState(), [events[2]], 2251, 120);

    expect(expiredPartial.results).toContainEqual(
      expect.objectContaining({ eventId: "chord", classification: "partial", points: 20 })
    );
    expect(expiredMissed.results).toContainEqual(
      expect.objectContaining({ eventId: "chord", classification: "missed", points: 0 })
    );
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

  it("prefers a candidate containing the played note over a closer wrong-pitch event", () => {
    const simultaneous: TimedNoteEvent[] = [
      { id: "near-wrong", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 1 },
      { id: "far-match", type: "note", notes: ["D4"], startBeat: 1.1, durationBeats: 1 }
    ];

    const judged = judgeTimelineInput(createTimelineJudgeState(), simultaneous, "D4", 500, 120);

    expect(judged.result).toMatchObject({ eventId: "far-match" });
  });
});
