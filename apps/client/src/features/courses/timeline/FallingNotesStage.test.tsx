import { render, screen } from "@testing-library/react";

import type { TimedNoteEvent } from "../courseTypes";
import { FallingNotesStage } from "./FallingNotesStage";
import type { PianoKeyGeometry } from "./fallingNotesTypes";

const geometry: PianoKeyGeometry[] = [
  { note: "C4", tone: "white", left: 20, width: 40, centerX: 40 }
];
const events: TimedNoteEvent[] = [
  { id: "c", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 2 }
];

describe("FallingNotesStage", () => {
  it("renders positioned note bars and strike line", () => {
    render(
      <FallingNotesStage
        events={events}
        geometry={geometry}
        currentBeat={0}
        results={{}}
        targetEventId="c"
      />
    );

    expect(screen.getByTestId("falling-notes-strike-line")).toBeInTheDocument();
    const note = screen.getByTestId("falling-note");
    expect(note).toHaveAttribute("data-state", "target");
    expect(note).toHaveAttribute("data-hit", "false");
    expect(note).toHaveStyle({ left: "20px", width: "40px" });
  });

  it("renders result state classes", () => {
    render(
      <FallingNotesStage
        events={events}
        geometry={geometry}
        currentBeat={0}
        results={{ c: "perfect" }}
      />
    );

    expect(screen.getByTestId("falling-note")).toHaveAttribute("data-state", "perfect");
  });

  it("renders successful hit impact and matching key-column glow", () => {
    render(
      <FallingNotesStage
        events={events}
        geometry={geometry}
        currentBeat={0}
        results={{ c: "good" }}
      />
    );

    expect(screen.getByTestId("falling-note")).toHaveAttribute("data-hit", "true");
    expect(screen.getByTestId("timeline-hit-impact")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-key-hit-glow")).toHaveStyle({
      left: "20px",
      width: "40px"
    });
  });

  it.each(["partial", "missed", "wrong"] as const)(
    "does not render success feedback for %s results",
    (classification) => {
      render(
        <FallingNotesStage
          events={events}
          geometry={geometry}
          currentBeat={0}
          results={{ c: classification }}
        />
      );

      expect(screen.getByTestId("falling-note")).toHaveAttribute("data-hit", "false");
      expect(screen.queryByTestId("timeline-hit-impact")).not.toBeInTheDocument();
      expect(screen.queryByTestId("timeline-key-hit-glow")).not.toBeInTheDocument();
    }
  );
});
