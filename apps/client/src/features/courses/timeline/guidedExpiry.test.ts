import type { TimedNoteEvent } from "../courseTypes";
import { createTimelineJudgeState, expireMissedEvents } from "./timingJudge";

const events: TimedNoteEvent[] = [
  { id: "first", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 1 },
  { id: "second", type: "note", notes: ["D4"], startBeat: 2, durationBeats: 1 },
  { id: "third", type: "note", notes: ["E4"], startBeat: 3, durationBeats: 1 }
];

describe("guided miss expiry", () => {
  it("stops after the first recoverable failure when requested", () => {
    const expired = expireMissedEvents(
      createTimelineJudgeState(),
      events,
      4000,
      120,
      undefined,
      { stopAfterFirstFailure: true }
    );

    expect(expired.results).toHaveLength(1);
    expect(expired.results[0]?.eventId).toBe("first");
    expect(expired.state.judgedEventIds).toEqual(["first"]);
  });

  it("preserves continuous expiry behavior when recovery locking is disabled", () => {
    const expired = expireMissedEvents(createTimelineJudgeState(), events, 4000, 120);

    expect(expired.results.map((result) => result.eventId)).toEqual(["first", "second", "third"]);
  });
});
