import { useEffect, useMemo, useRef, useState } from "react";

import type { TimedNoteEvent } from "../courseTypes";
import { layoutFallingNotes } from "./fallingNotesLayout";
import type { PianoKeyGeometry } from "./fallingNotesTypes";
import type { TimingClassification } from "./timingJudge";

type FallingNotesStageProps = {
  events: TimedNoteEvent[];
  geometry: PianoKeyGeometry[];
  currentBeat: number;
  getCurrentBeat?: () => number;
  results: Record<string, TimingClassification>;
  targetEventId?: string;
};

const stageHeight = 300;
type FallingNoteVisualState = TimingClassification | "target" | "upcoming";
const noteStateClass: Record<FallingNoteVisualState, string> = {
  perfect: "border-emerald-100 bg-emerald-300",
  good: "border-emerald-100 bg-emerald-300",
  early: "border-amber-100 bg-amber-300",
  late: "border-amber-100 bg-amber-300",
  partial: "border-sky-100 bg-sky-300",
  missed: "border-rose-100 bg-rose-300 opacity-70",
  wrong: "border-rose-100 bg-rose-300 opacity-70",
  target: "border-white bg-amber-200",
  upcoming: "border-stone-100/70 bg-stone-100"
};

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    setReduced(query.matches);
    const update = () => setReduced(query.matches);
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return reduced;
};

export const FallingNotesStage = ({
  events,
  geometry,
  currentBeat,
  getCurrentBeat,
  results,
  targetEventId
}: FallingNotesStageProps) => {
  const reducedMotion = useReducedMotion();
  const [visualBeat, setVisualBeat] = useState(currentBeat);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setVisualBeat(currentBeat);
  }, [currentBeat]);

  useEffect(() => {
    if (!getCurrentBeat || reducedMotion) return;
    const tick = () => {
      setVisualBeat(getCurrentBeat());
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [getCurrentBeat, reducedMotion]);

  const layouts = useMemo(
    () =>
      layoutFallingNotes({
        events,
        geometry,
        currentBeat: visualBeat,
        stageHeight
      }),
    [events, geometry, visualBeat]
  );

  return (
    <section
      aria-label="Falling notes"
      className="relative min-h-[14rem] overflow-hidden rounded-lg border border-white/10 bg-[#171411]"
      style={{ height: stageHeight }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-amber-100"
        data-testid="falling-notes-strike-line"
      />
      {layouts.map((layout) => {
        const result = results[layout.eventId];
        const state: FallingNoteVisualState =
          result ?? (targetEventId === layout.eventId ? "target" : "upcoming");

        return (
          <div
            key={`${layout.eventId}-${layout.note}`}
            data-testid="falling-note"
            data-event-id={layout.eventId}
            data-note-id={layout.note}
            data-state={state}
            className={[
              "absolute top-0 rounded-sm border text-[0.65rem] font-black leading-none text-stone-950",
              noteStateClass[state]
            ].join(" ")}
            style={{
              left: layout.left,
              width: layout.width,
              height: layout.height,
              zIndex: layout.zIndex,
              transform: `translate3d(0, ${layout.translateY}px, 0)`,
              transition: reducedMotion ? "none" : undefined
            }}
          >
            <span className="sr-only">{layout.note}</span>
          </div>
        );
      })}
    </section>
  );
};
