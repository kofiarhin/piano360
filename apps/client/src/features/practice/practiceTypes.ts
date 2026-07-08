export type NoteId =
  | "A3"
  | "A#3"
  | "B3"
  | "C4"
  | "C#4"
  | "D4"
  | "D#4"
  | "E4"
  | "F4"
  | "F#4"
  | "G4"
  | "G#4"
  | "A4"
  | "A#4"
  | "B4"
  | "C5";

export type PracticeMode = "practice" | "freestyle";

export type NoteResult = "pending" | "correct" | "missed";

export type FeedbackKind = "idle" | "correct" | "wrong" | "missed";

export type PianoKeyTone = "white" | "black";

export type PianoKeyDefinition = {
  noteId: NoteId;
  tone: PianoKeyTone;
  keyboardKey?: string;
};

export type PracticeSong = {
  id: string;
  title: string;
  artist: string;
  key: string;
  measureCount: number;
  notes: NoteId[];
};
