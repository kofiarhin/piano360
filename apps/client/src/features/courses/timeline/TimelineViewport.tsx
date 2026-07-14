import { noteIds, type SongTimeline } from "../courseTypes";
import { beatToPixels, beatsPerMeasure } from "./timelineMath";
import type { TimingClassification } from "./timingJudge";

const PIXELS_PER_BEAT = 72;
const LANE_HEIGHT = 7;
const TRACK_HEIGHT = noteIds.length * LANE_HEIGHT;

type TimelineViewportProps = {
  timeline: SongTimeline;
  currentBeat: number;
  results: Record<string, TimingClassification>;
  targetEventId?: string;
};

const resultClass = (classification?: TimingClassification) => {
  if (classification === "perfect") return "border-emerald-200 bg-emerald-400 text-emerald-950";
  if (classification === "good") return "border-lime-200 bg-lime-400 text-lime-950";
  if (classification === "accepted") return "border-amber-100 bg-amber-300 text-stone-950";
  if (classification === "missed" || classification === "wrong")
    return "border-rose-200 bg-rose-400/70 text-rose-950";
  return "border-stone-300/60 bg-stone-100 text-stone-950";
};

export const TimelineViewport = ({
  timeline,
  currentBeat,
  results,
  targetEventId
}: TimelineViewportProps) => {
  const measureBeats = beatsPerMeasure(
    timeline.timeSignature.numerator,
    timeline.timeSignature.denominator
  );
  const gridBeats = Array.from({ length: Math.ceil(timeline.totalBeats) + 1 }, (_, index) => index);
  const trackWidth = beatToPixels(timeline.totalBeats, PIXELS_PER_BEAT);

  return (
    <section
      aria-label="Rhythm timeline"
      className="timeline-viewport relative min-w-0 overflow-hidden border-y border-white/10 bg-stone-950"
    >
      <div
        className="absolute inset-y-0 left-[30%] z-20 w-0.5 bg-amber-200"
        aria-label="Judgement line"
      >
        <span className="absolute left-1 top-2 whitespace-nowrap bg-stone-950/90 px-1 text-[0.68rem] font-black uppercase text-amber-100">
          Play
        </span>
      </div>
      <div
        className="relative will-change-transform"
        style={{
          width: `${trackWidth}px`,
          height: `${TRACK_HEIGHT}px`,
          transform: `translate3d(calc(30vw - ${beatToPixels(currentBeat, PIXELS_PER_BEAT)}px), 0, 0)`
        }}
      >
        {gridBeats.map((beat) => (
          <div
            key={beat}
            className={
              beat % measureBeats === 0
                ? "absolute inset-y-0 border-l border-amber-100/35"
                : "absolute inset-y-0 border-l border-white/10"
            }
            style={{ left: `${beatToPixels(beat, PIXELS_PER_BEAT)}px` }}
          >
            <span className="absolute left-1 top-1 font-mono text-[0.65rem] text-stone-500">
              {beat % measureBeats === 0 ? Math.floor(beat / measureBeats) + 1 : ""}
            </span>
          </div>
        ))}
        {timeline.events.map((event) => {
          if (event.type === "rest") {
            return (
              <div
                key={event.id}
                className="absolute top-8 h-6 border-t-2 border-dashed border-stone-500 text-xs text-stone-500"
                style={{
                  left: `${beatToPixels(event.startBeat, PIXELS_PER_BEAT)}px`,
                  width: `${beatToPixels(event.durationBeats, PIXELS_PER_BEAT)}px`
                }}
              >
                Rest
              </div>
            );
          }

          return event.notes.map((note) => {
            const lane = noteIds.indexOf(note);

            return (
              <div
                key={`${event.id}-${note}`}
                data-event-id={event.id}
                data-note-id={note}
                className={[
                  "absolute flex h-6 min-w-8 items-center overflow-hidden rounded border px-1 font-mono text-xs font-black",
                  resultClass(results[event.id]),
                  targetEventId === event.id
                    ? "ring-2 ring-amber-200 ring-offset-2 ring-offset-stone-950"
                    : ""
                ].join(" ")}
                style={{
                  left: `${beatToPixels(event.startBeat, PIXELS_PER_BEAT)}px`,
                  top: `${(noteIds.length - 1 - lane) * LANE_HEIGHT}px`,
                  width: `${Math.max(32, beatToPixels(event.durationBeats, PIXELS_PER_BEAT) - 3)}px`
                }}
              >
                {note}
              </div>
            );
          });
        })}
      </div>
    </section>
  );
};
