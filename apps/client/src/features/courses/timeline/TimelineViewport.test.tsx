import { render, screen } from "@testing-library/react";

import type { SongTimeline } from "../courseTypes";
import { TimelineViewport } from "./TimelineViewport";

const timeline: SongTimeline = {
  schemaVersion: 2,
  timingSource: "instructional",
  originalBpm: 60,
  timeSignature: { numerator: 4, denominator: 4 },
  countInBeats: 4,
  totalBeats: 4,
  source: {
    type: "instructional-template",
    reviewStatus: "instructional"
  },
  instructionalTemplate: {
    templateId: "foundational-quarter-note-v1",
    eventSpacingBeats: 2,
    noteDurationBeats: 1,
    firstEventBeat: 0,
    originalBpm: 60,
    countInBeats: 4,
    timingWindows: { perfectMs: 180, goodMs: 350, acceptedMs: 700 }
  },
  events: [
    {
      id: "c-major",
      type: "note",
      notes: ["C4", "E4", "G4"],
      startBeat: 0,
      durationBeats: 1
    }
  ]
};

describe("TimelineViewport", () => {
  it("renders one aligned visual block per chord pitch", () => {
    render(
      <TimelineViewport timeline={timeline} currentBeat={0} results={{}} targetEventId="c-major" />
    );

    const chordBlocks = document.querySelectorAll('[data-event-id="c-major"]');
    expect(chordBlocks).toHaveLength(3);
    expect(screen.getByText("C4")).toBeInTheDocument();
    expect(screen.getByText("E4")).toBeInTheDocument();
    expect(screen.getByText("G4")).toBeInTheDocument();

    const leftPositions = Array.from(chordBlocks).map((block) => (block as HTMLElement).style.left);
    expect(new Set(leftPositions)).toEqual(new Set(["0px"]));
  });
});
