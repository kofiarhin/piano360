export const noteIds = [
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5"
] as const;

export type NoteId = (typeof noteIds)[number];

const noteIdSet = new Set<string>(noteIds);

export const isNoteId = (value: unknown): value is NoteId =>
  typeof value === "string" && noteIdSet.has(value);
