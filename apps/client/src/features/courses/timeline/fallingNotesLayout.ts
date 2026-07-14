import type { TimedNoteEvent } from "../courseTypes";
import type { FallingNoteLayout, PianoKeyGeometry } from "./fallingNotesTypes";

export const LOOK_AHEAD_BEATS = 4;
export const TRAILING_BEATS = 1;

type FallingNotesLayoutOptions = {
  events: TimedNoteEvent[];
  geometry: PianoKeyGeometry[];
  currentBeat: number;
  stageHeight: number;
  lookAheadBeats?: number;
  trailingBeats?: number;
};

export const layoutFallingNotes = ({
  events,
  geometry,
  currentBeat,
  stageHeight,
  lookAheadBeats = LOOK_AHEAD_BEATS,
  trailingBeats = TRAILING_BEATS
}: FallingNotesLayoutOptions): FallingNoteLayout[] => {
  const geometryByNote = new Map(geometry.map((key) => [key.note, key]));
  const pixelsPerBeat = stageHeight / lookAheadBeats;
  const visibleStart = currentBeat - trailingBeats;
  const visibleEnd = currentBeat + lookAheadBeats;

  return events
    .filter(
      (event) =>
        event.startBeat + event.durationBeats >= visibleStart && event.startBeat <= visibleEnd
    )
    .flatMap((event) =>
      event.notes.flatMap((note) => {
        const key = geometryByNote.get(note);
        if (!key) return [];

        const bottomY = stageHeight - (event.startBeat - currentBeat) * pixelsPerBeat;
        const height = Math.max(14, event.durationBeats * pixelsPerBeat);
        return {
          eventId: event.id,
          note,
          left: key.left,
          width: key.width,
          height,
          translateY: bottomY - height,
          zIndex: key.tone === "black" ? 2 : 1
        };
      })
    );
};
