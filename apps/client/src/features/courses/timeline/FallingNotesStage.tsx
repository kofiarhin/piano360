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

const successfulResultStates = new Set<TimingClassification>(["perfect", "good", "early", "late"]);
const hitParticles = Array.from({ length: 6 }, (_, index) => index);

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
      [events, geometry, stageHeight, visualBeat]
    );

    return (
      <section
        ref={setStageRef}
        aria-label="Falling notes"
        className="timeline-falling-notes-stage relative min-h-[180px] rounded-md border border-white/10 md:min-h-[240px]"
        data-testid="falling-notes-stage"
        style={{ height: "clamp(180px, 34dvh, 440px)" }}
      >
        <div className="timeline-falling-notes-viewport" aria-hidden="true">
          <div
            className="absolute inset-x-0 bottom-0 z-20 h-px bg-amber-100 shadow-[0_0_12px_rgba(253,230,138,0.65)]"
            data-testid="falling-notes-strike-line"
          />
          {layouts.map((layout) => {
            const result = results[layout.eventId];
            const state: FallingNoteVisualState =
              result ?? (targetEventId === layout.eventId ? "target" : "upcoming");
            const successfulHit = result !== undefined && successfulResultStates.has(result);
            const resolvedTranslateY = successfulHit
              ? Math.max(0, stageHeight - layout.height)
              : layout.translateY;

            return (
              <div key={`${layout.eventId}-${layout.note}-visual`}>
                <div
                  data-testid="falling-note"
                  data-event-id={layout.eventId}
                  data-note-id={layout.note}
                  data-state={state}
                  data-hit={successfulHit ? "true" : "false"}
                  className={[
                    "timeline-falling-note absolute top-0 rounded-sm border text-[0.65rem] font-black leading-none text-stone-950",
                    successfulHit ? "timeline-falling-note--hit" : "",
                    noteStateClass[state]
                  ].join(" ")}
                  style={{
                    left: layout.left,
                    width: layout.width,
                    height: layout.height,
                    zIndex: layout.zIndex,
                    transform: `translate3d(0, ${resolvedTranslateY}px, 0)`,
                    transition: reducedMotion ? "none" : undefined
                  }}
                >
                  <span className="sr-only">{layout.note}</span>
                </div>

                {successfulHit ? (
                  <div
                    aria-hidden="true"
                    className="timeline-hit-impact"
                    data-testid="timeline-hit-impact"
                    style={{ left: layout.left + layout.width / 2 }}
                  >
                    {hitParticles.map((particle) => (
                      <span key={particle} className="timeline-hit-particle" />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {layouts.map((layout) => {
          const result = results[layout.eventId];
          const successfulHit = result !== undefined && successfulResultStates.has(result);

          if (!successfulHit) {
            return null;
          }

          return (
            <div
              key={`${layout.eventId}-${layout.note}-key-glow`}
              aria-hidden="true"
              className="timeline-key-hit-glow"
              data-testid="timeline-key-hit-glow"
              style={{ left: layout.left, width: layout.width }}
            />
          );
        })}
      </section>
    );
  }
);
