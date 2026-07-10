import type { NoteId } from "./courseTypes";

export const keyboardMap: Record<string, NoteId> = {
  a: "A3",
  w: "A#3",
  s: "B3",
  d: "C4",
  e: "C#4",
  f: "D4",
  r: "D#4",
  g: "E4",
  h: "F4",
  y: "F#4",
  j: "G4",
  u: "G#4",
  k: "A4",
  i: "A#4",
  l: "B4",
  ";": "C5"
};

export const keyboardKeys = [
  { noteId: "A3", tone: "white", keyboardKey: "A" },
  { noteId: "A#3", tone: "black", keyboardKey: "W" },
  { noteId: "B3", tone: "white", keyboardKey: "S" },
  { noteId: "C4", tone: "white", keyboardKey: "D" },
  { noteId: "C#4", tone: "black", keyboardKey: "E" },
  { noteId: "D4", tone: "white", keyboardKey: "F" },
  { noteId: "D#4", tone: "black", keyboardKey: "R" },
  { noteId: "E4", tone: "white", keyboardKey: "G" },
  { noteId: "F4", tone: "white", keyboardKey: "H" },
  { noteId: "F#4", tone: "black", keyboardKey: "Y" },
  { noteId: "G4", tone: "white", keyboardKey: "J" },
  { noteId: "G#4", tone: "black", keyboardKey: "U" },
  { noteId: "A4", tone: "white", keyboardKey: "K" },
  { noteId: "A#4", tone: "black", keyboardKey: "I" },
  { noteId: "B4", tone: "white", keyboardKey: "L" },
  { noteId: "C5", tone: "white", keyboardKey: ";" }
] as const satisfies ReadonlyArray<{
  noteId: NoteId;
  tone: "white" | "black";
  keyboardKey: string;
}>;
