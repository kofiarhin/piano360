import type { NoteId } from "../courseTypes";

export type NoteInputSource = "computer-keyboard" | "on-screen-piano" | "midi";

export type NoteAttempt = {
  note: NoteId;
  source: NoteInputSource;
  timestampMs: number;
};
