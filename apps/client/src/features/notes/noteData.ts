import type { NoteId, PianoKeyDefinition } from "./noteTypes";

export const pianoNotes: NoteId[] = [
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
];

export const whiteKeyMap: Record<string, NoteId> = {
  a: "A3",
  s: "B3",
  d: "C4",
  f: "D4",
  g: "E4",
  h: "F4",
  j: "G4",
  k: "A4",
  l: "B4",
  ";": "C5"
};

export const blackKeyMap: Record<string, NoteId> = {
  w: "A#3",
  e: "C#4",
  r: "D#4",
  y: "F#4",
  u: "G#4",
  i: "A#4"
};

export const keyboardMap: Record<string, NoteId> = {
  ...whiteKeyMap,
  ...blackKeyMap
};

export const noteIds = new Set<NoteId>(pianoNotes);

export const isNoteId = (value: unknown): value is NoteId =>
  typeof value === "string" && noteIds.has(value as NoteId);

export const pianoKeys: PianoKeyDefinition[] = pianoNotes.map((noteId) => {
  const keyboardKey = Object.entries(keyboardMap).find(([, note]) => note === noteId)?.[0];

  return {
    noteId,
    tone: noteId.includes("#") ? "black" : "white",
    keyboardKey: keyboardKey?.toUpperCase()
  };
});
