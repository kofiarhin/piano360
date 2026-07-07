import type { Hand, KeyboardRange, NoteTarget } from "../../content";

export type ChromaticNoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export type PianoKeyType = "white" | "black";

export type KeyHighlightState = "none" | "target" | "correct" | "incorrect" | "completed" | "pending";

export type PianoKeyModel = {
  noteId: string;
  noteName: ChromaticNoteName;
  octave: number;
  keyType: PianoKeyType;
  displayLabel: string;
  highlightState: KeyHighlightState;
  hand?: Hand;
  finger?: number;
  isTarget: boolean;
};

export type VirtualPianoProps = {
  range: KeyboardRange;
  targetNotes?: NoteTarget[];
  activeNoteIds?: string[];
  showLabels?: boolean;
  showHints?: boolean;
  onKeyPress?: (key: PianoKeyModel) => void;
  className?: string;
};
