import type { TimedNoteEvent } from "../courseTypes";
import {
  createTimelineJudgeState,
  expireMissedEvents,
  judgeTimelineInput,
  type JudgeOutcome
} from "./timingJudge";

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

const expectScored = (outcome: JudgeOutcome) => {
  expect(outcome.type).toBe("scored");
  if (outcome.type !== "scored") throw new Error(`Expected scored, received ${outcome.type}`);
  return outcome.result;
};

describe("timeline input judgement", () => {
  it("matches repeated pitches to distinct nearby event ids", () => {
    const first = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 510, 120);
    const second = judgeTimelineInput(first.state, events, "C4", 1020, 120);

    expect(expectScored(first)).toMatchObject({
      eventId: "first-c",
      classification: "perfect",
      deltaMs: 10
    });
    expect(expectScored(second)).toMatchObject({
      eventId: "second-c",
      classification: "perfect",
      deltaMs: 20
    });
  });

  it("records early and late raw timing deltas", () => {
    const early = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 260, 120);
    const late = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 720, 120);

    expect(expectScored(early)).toMatchObject({
      classification: "early",
      deltaMs: -240,
      points: 40
    });
    expect(expectScored(late)).toMatchObject({ classification: "late", deltaMs: 220, points: 40 });
  });

  it("classifies inclusive timing boundaries and ignores outside windows", () => {
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
      expect(expectScored(judged)).toMatchObject({ classification, deltaMs: delta });
    }

    expect(judgeTimelineInput(createTimelineJudgeState(), events, "C4", 249, 120)).toMatchObject({
      type: "ignored"
    });
    expect(judgeTimelineInput(createTimelineJudgeState(), events, "C4", 1251, 120)).toMatchObject({
      type: "ignored"
    });
  });

  it("collects a chord in any order and scores it by least accurate note", () => {
    const first = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 2000, 120);
    const second = judgeTimelineInput(first.state, events, "G4", 2040, 120);
    const duplicate = judgeTimelineInput(second.state, events, "G4", 2060, 120);
    const third = judgeTimelineInput(duplicate.state, events, "E4", 2161, 120);

    expect(first).toMatchObject({
      type: "pending-chord",
      eventId: "chord",
      playedNotes: ["C4"],
      remainingNotes: ["E4", "G4"]
    });
    expect(second).toMatchObject({
      type: "pending-chord",
      playedNotes: ["C4", "G4"],
      remainingNotes: ["E4"]
    });
    expect(duplicate).toMatchObject({
      type: "pending-chord",
      playedNotes: ["C4", "G4"],
      remainingNotes: ["E4"]
    });
    expect(expectScored(third)).toMatchObject({
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
    expect(expectScored(next).eventId).toBe("second-c");
  });

  it("reports a wrong pitch near an expected event", () => {
    const judged = judgeTimelineInput(createTimelineJudgeState(), events, "F4", 500, 120);

    expect(judged).toMatchObject({
      type: "wrong",
      result: { eventId: "first-c", classification: "wrong" },
      state: { judgedEventIds: [] }
    });
  });

  it("prefers a candidate containing the played note over a closer wrong-pitch event", () => {
    const simultaneous: TimedNoteEvent[] = [
      { id: "near-wrong", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 1 },
      { id: "far-match", type: "note", notes: ["D4"], startBeat: 1.1, durationBeats: 1 }
    ];

    const judged = judgeTimelineInput(createTimelineJudgeState(), simultaneous, "D4", 500, 120);

    expect(expectScored(judged)).toMatchObject({ eventId: "far-match" });
  });

  it("ignores input between events, before the first window, and after all events", () => {
    expect(judgeTimelineInput(createTimelineJudgeState(), events, "D4", 100, 120)).toMatchObject({
      type: "ignored"
    });
    expect(judgeTimelineInput(createTimelineJudgeState(), events, "D4", 1260, 120)).toMatchObject({
      type: "ignored"
    });
    expect(judgeTimelineInput(createTimelineJudgeState(), events, "D4", 3200, 120)).toMatchObject({
      type: "ignored"
    });
  });

  it("uses the earlier start beat as the final candidate tie-breaker", () => {
    const overlapping: TimedNoteEvent[] = [
      { id: "early-d", type: "note", notes: ["D4"], startBeat: 1, durationBeats: 1 },
      { id: "late-d", type: "note", notes: ["D4"], startBeat: 1.2, durationBeats: 1 }
    ];

    const judged = judgeTimelineInput(createTimelineJudgeState(), overlapping, "D4", 550, 120);

    expect(expectScored(judged)).toMatchObject({ eventId: "early-d" });
  });
});
