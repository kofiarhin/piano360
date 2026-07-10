import type { NoteId } from "../notes";

export type { NoteId, PianoKeyDefinition, PianoKeyTone } from "../notes";

export type PracticeMode = "practice" | "freestyle";

export type NoteResult = "pending" | "correct" | "missed";

export type FeedbackKind = "idle" | "correct" | "wrong" | "missed";

export type PracticeSong = {
  id: string;
  title: string;
  artist: string;
  key: string;
  measureCount: number;
  notes: NoteId[];
};
