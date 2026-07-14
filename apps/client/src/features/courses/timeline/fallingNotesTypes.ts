import type { NoteId } from "../courseTypes";

export type PianoKeyGeometry = {
  note: NoteId;
  tone: "white" | "black";
  left: number;
  width: number;
  centerX: number;
};

export type FallingNoteLayout = {
  eventId: string;
  note: NoteId;
  left: number;
  width: number;
  height: number;
  translateY: number;
  zIndex: number;
};
