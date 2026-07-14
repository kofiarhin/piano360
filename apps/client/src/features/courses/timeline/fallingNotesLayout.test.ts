import type { TimedNoteEvent } from "../courseTypes";
import { layoutFallingNotes } from "./fallingNotesLayout";
import type { PianoKeyGeometry } from "./fallingNotesTypes";

const geometry: PianoKeyGeometry[] = [
  { note: "C4", tone: "white", left: 10, width: 30, centerX: 25 },
  { note: "C#4", tone: "black", left: 28, width: 18, centerX: 37 },
  { note: "E4", tone: "white", left: 70, width: 30, centerX: 85 }
];

const events: TimedNoteEvent[] = [
  { id: "c", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 1 },
  { id: "chord", type: "note", notes: ["C4", "C#4"], startBeat: 2, durationBeats: 2 },
  { id: "missing", type: "note", notes: ["G4"], startBeat: 2, durationBeats: 1 },
  { id: "future", type: "note", notes: ["E4"], startBeat: 8, durationBeats: 1 }
];

describe("layoutFallingNotes", () => {
  it("aligns notes to supplied piano key geometry", () => {
    const [layout] = layoutFallingNotes({
      events: [events[0]],
      geometry,
      currentBeat: 0,
      stageHeight: 400
    });

    expect(layout).toMatchObject({
      eventId: "c",
      note: "C4",
      left: 10,
      width: 30,
      height: 100,
      translateY: 200
    });
    expect(layout.translateY + layout.height).toBe(300);
  });

  it("keeps chord bars on the same target Y and uses black-key z-index", () => {
    const layouts = layoutFallingNotes({
      events: [events[1]],
      geometry,
      currentBeat: 1,
      stageHeight: 400
    });

    expect(layouts).toHaveLength(2);
    expect(layouts[0].translateY).toBe(layouts[1].translateY);
    expect(layouts.find((layout) => layout.note === "C#4")?.zIndex).toBe(2);
  });

  it("filters visible events and omits missing geometry safely", () => {
    const layouts = layoutFallingNotes({
      events,
      geometry,
      currentBeat: 0,
      stageHeight: 400
    });

    expect(layouts.map((layout) => layout.eventId)).not.toContain("future");
    expect(layouts.map((layout) => layout.eventId)).not.toContain("missing");
  });

  it("places the bar bottom exactly on the strike line at the target beat", () => {
    const [layout] = layoutFallingNotes({
      events: [events[0]],
      geometry,
      currentBeat: events[0].startBeat,
      stageHeight: 360
    });

    expect(layout.translateY + layout.height).toBe(360);
  });

  it("preserves target alignment when stage height changes", () => {
    const small = layoutFallingNotes({
      events: [events[0]],
      geometry,
      currentBeat: events[0].startBeat,
      stageHeight: 240
    })[0];
    const large = layoutFallingNotes({
      events: [events[0]],
      geometry,
      currentBeat: events[0].startBeat,
      stageHeight: 480
    })[0];

    expect(small.translateY + small.height).toBe(240);
    expect(large.translateY + large.height).toBe(480);
    expect(large.height).toBe(small.height * 2);
  });

  it("culls notes outside the look-ahead and trailing windows", () => {
    const layouts = layoutFallingNotes({
      events: [
        { id: "past", type: "note", notes: ["C4"], startBeat: -2.1, durationBeats: 1 },
        { id: "trailing", type: "note", notes: ["C4"], startBeat: -1, durationBeats: 1 },
        { id: "ahead", type: "note", notes: ["C4"], startBeat: 4, durationBeats: 1 },
        { id: "future", type: "note", notes: ["C4"], startBeat: 4.1, durationBeats: 1 }
      ],
      geometry,
      currentBeat: 0,
      stageHeight: 400
    });

    expect(layouts.map((layout) => layout.eventId)).toEqual(["trailing", "ahead"]);
  });
});
