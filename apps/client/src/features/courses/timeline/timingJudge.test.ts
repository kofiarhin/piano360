import type { TimedNoteEvent } from "../courseTypes";
import {
  createTimelineJudgeState,
  expireMissedEvents,
  judgeTimelineInput,
  judgeTimelineRelease,
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

const expectHolding = (outcome: JudgeOutcome) => {
  expect(outcome.type).toBe("holding");
  if (outcome.type !== "holding") throw new Error(`Expected holding, received ${outcome.type}`);
  return outcome;
};

const scorePressRelease = (
  state: ReturnType<typeof createTimelineJudgeState>,
  note: "C4" | "D4" | "E4" | "F4" | "G4",
  pressMs: number,
  releaseMs: number,
  bpm = 120,
  targetEvents = events
) => {
  const pressed = judgeTimelineInput(state, targetEvents, note, pressMs, bpm);
  expectHolding(pressed);
  return judgeTimelineRelease(pressed.state, targetEvents, note, releaseMs, bpm);
};

describe("timeline input judgement", () => {
  it("matches repeated pitches to distinct nearby event ids", () => {
    const first = scorePressRelease(createTimelineJudgeState(), "C4", 510, 1000);
    const second = scorePressRelease(first.state, "C4", 1020, 1500);

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
    const early = scorePressRelease(createTimelineJudgeState(), "C4", 260, 1000);
    const late = scorePressRelease(createTimelineJudgeState(), "C4", 720, 1050);

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
      const pressMs = 500 + delta;
      const releaseMs = Math.max(1000, pressMs + 350);
      const judged = scorePressRelease(createTimelineJudgeState(), "C4", pressMs, releaseMs);
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
    const release = judgeTimelineRelease(third.state, events, "C4", 2500, 120);

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
    expect(expectHolding(third)).toMatchObject({
      eventId: "chord",
      playedNotes: ["C4", "G4", "E4"],
      onsetDeltaMs: 161
    });
    expect(expectScored(release)).toMatchObject({
      eventId: "chord",
      classification: "late",
      deltaMs: 161,
      playedNotes: ["C4", "G4", "E4"]
    });
    expect(release.state.judgedEventIds).toContain("chord");
  });

  it("requires chord notes to stay active together before the chord target completes", () => {
    const first = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 2000, 120);
    const releasedFirst = judgeTimelineRelease(first.state, events, "C4", 2020, 120);
    const second = judgeTimelineInput(releasedFirst.state, events, "E4", 2040, 120);
    const third = judgeTimelineInput(second.state, events, "G4", 2060, 120);

    expect(first).toMatchObject({ type: "pending-chord", playedNotes: ["C4"] });
    expect(releasedFirst).toMatchObject({
      type: "ignored",
      state: { pendingChord: undefined }
    });
    expect(third).toMatchObject({
      type: "pending-chord",
      playedNotes: ["E4", "G4"],
      remainingNotes: ["C4"]
    });
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
    const next = scorePressRelease(missed.state, "C4", 1010, 1500);

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

    expect(expectHolding(judged)).toMatchObject({ eventId: "far-match" });
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

    expect(expectHolding(judged)).toMatchObject({ eventId: "early-d" });
  });

  it("requires release near the note end before an event is scored correct", () => {
    const pressed = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 500, 120);
    expectHolding(pressed);

    const earlyRelease = judgeTimelineRelease(pressed.state, events, "C4", 650, 120);
    const correctRelease = scorePressRelease(createTimelineJudgeState(), "C4", 500, 1000);

    expect(expectScored(earlyRelease)).toMatchObject({
      eventId: "first-c",
      classification: "partial"
    });
    expect(expectScored(correctRelease)).toMatchObject({
      eventId: "first-c",
      classification: "perfect"
    });
  });

  it("makes long notes require a longer hold than short notes", () => {
    const durationEvents: TimedNoteEvent[] = [
      { id: "short", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 },
      { id: "long", type: "note", notes: ["D4"], startBeat: 3, durationBeats: 2 }
    ];

    const shortEnough = scorePressRelease(
      createTimelineJudgeState(),
      "C4",
      0,
      350,
      60,
      durationEvents
    );
    const longTooShort = scorePressRelease(
      createTimelineJudgeState(),
      "D4",
      3000,
      3350,
      60,
      durationEvents
    );
    const longEnough = scorePressRelease(
      createTimelineJudgeState(),
      "D4",
      3000,
      5000,
      60,
      durationEvents
    );

    expect(expectScored(shortEnough)).toMatchObject({
      eventId: "short",
      classification: "perfect"
    });
    expect(expectScored(longTooShort)).toMatchObject({
      eventId: "long",
      classification: "partial"
    });
    expect(expectScored(longEnough)).toMatchObject({ eventId: "long", classification: "perfect" });
  });

  it("does not let one continuous hold satisfy separate repeated-note events", () => {
    const firstPress = judgeTimelineInput(createTimelineJudgeState(), events, "C4", 500, 120);
    const secondPressWhileHeld = judgeTimelineInput(firstPress.state, events, "C4", 1000, 120);
    const expiredHold = expireMissedEvents(firstPress.state, events, 1300, 120);

    expectHolding(firstPress);
    expect(secondPressWhileHeld).toMatchObject({ type: "ignored" });
    expect(expiredHold.results).toContainEqual(
      expect.objectContaining({ eventId: "first-c", classification: "partial" })
    );
  });
});
