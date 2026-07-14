import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const fallbackStageHeight = 320;
type FallingNoteVisualState = TimingClassification | "target" | "upcoming";
const noteStateClass: Record<FallingNoteVisualState, string> = {
  perfect: "border-emerald-50 bg-emerald-200",
  good: "border-lime-50 bg-lime-300",
  early: "border-amber-100 bg-amber-300",
  late: "border-orange-100 bg-orange-300",
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

export const FallingNotesStage = forwardRef<HTMLElement, FallingNotesStageProps>(
  function FallingNotesStage(
    { events, geometry, currentBeat, getCurrentBeat, results, targetEventId },
    forwardedRef
  ) {
    const reducedMotion = useReducedMotion();
    const stageRef = useRef<HTMLElement | null>(null);
    const [visualBeat, setVisualBeat] = useState(currentBeat);
    const [stageHeight, setStageHeight] = useState(fallbackStageHeight);
    const frameRef = useRef<number | undefined>(undefined);
    const setStageRef = useCallback(
      (node: HTMLElement | null) => {
        stageRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    useEffect(() => {
      setVisualBeat(currentBeat);
    }, [currentBeat]);

    useEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const updateHeight = () => {
        const nextHeight = stage.getBoundingClientRect().height;
        if (nextHeight > 0) {
          setStageHeight(nextHeight);
        }
      };

      updateHeight();
      const Observer = window.ResizeObserver;
      const observer = Observer ? new Observer(updateHeight) : undefined;
      observer?.observe(stage);
      window.addEventListener("resize", updateHeight);
      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", updateHeight);
      };
    }, []);

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
        ref={setStageRef}
        aria-label="Falling notes"
        className="relative min-h-[180px] overflow-hidden rounded-md border border-white/10 bg-[#171411] md:min-h-[240px]"
        data-testid="falling-notes-stage"
        style={{ height: "clamp(180px, 34dvh, 440px)" }}
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
  }
);
