import { render, screen } from "@testing-library/react";

import type { TimedNoteEvent } from "../courseTypes";
import { FallingNotesStage } from "./FallingNotesStage";
import type { PianoKeyGeometry } from "./fallingNotesTypes";
import type { TimingClassification } from "./timingJudge";

const geometry: PianoKeyGeometry[] = [
  { note: "C4", tone: "white", left: 20, width: 40, centerX: 40 }
];
const events: TimedNoteEvent[] = [
  { id: "c", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 2 }
];
const successfulClassifications: TimingClassification[] = ["perfect", "good", "early", "late"];

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

  it.each(successfulClassifications)(
    "renders successful hit impact and matching key-column glow for %s results",
    (classification) => {
      render(
        <FallingNotesStage
          events={events}
          geometry={geometry}
          currentBeat={1}
          results={{ c: classification }}
        />
      );

      const note = screen.getByTestId("falling-note");
      expect(note).toHaveAttribute("data-state", classification);
      expect(note).toHaveAttribute("data-hit", "true");
      expect(note).toHaveClass("timeline-falling-note--hit");
      expect(note).toHaveStyle({ transform: "translate3d(0, 160px, 0)" });
      expect(screen.getByTestId("timeline-hit-impact")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getAllByTestId("timeline-hit-impact")).toHaveLength(1);
      expect(document.querySelectorAll(".timeline-hit-particle")).toHaveLength(6);
      expect(screen.getByTestId("timeline-key-hit-glow")).toHaveStyle({
        left: "20px",
        width: "40px"
      });
      expect(screen.getByTestId("timeline-key-hit-glow")).toHaveAttribute("aria-hidden", "true");
    }
  );

  it("renders successful hits without changing deterministic lane geometry", () => {
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
