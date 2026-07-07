import type { KeyboardRange, NoteName, NoteTarget } from "../../content";
import type { ChromaticNoteName, KeyHighlightState, PianoKeyModel } from "./pianoTypes";

const chromaticNotes: ChromaticNoteName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];

const noteSemitone: Record<NoteName, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

export const toNoteId = (note: string, octave: number) => `${note}${octave}`;

export const noteToMidi = (note: NoteName, octave: number) => (octave + 1) * 12 + noteSemitone[note];

export const targetToNoteId = (target: NoteTarget) => toNoteId(target.note, target.octave);

export const isNoteInRange = (target: NoteTarget, range: KeyboardRange) => {
  const midi = noteToMidi(target.note, target.octave);
  return midi >= noteToMidi(range.startNote, range.startOctave) && midi <= noteToMidi(range.endNote, range.endOctave);
};

export const buildKeyboardKeys = (
  range: KeyboardRange,
  targetNotes: NoteTarget[] = [],
  activeNoteIds: string[] = []
): PianoKeyModel[] => {
  const start = noteToMidi(range.startNote, range.startOctave);
  const end = noteToMidi(range.endNote, range.endOctave);
  const targetById = new Map(targetNotes.map((target) => [targetToNoteId(target), target]));
  const active = new Set(activeNoteIds);

  return Array.from({ length: end - start + 1 }, (_, index) => {
    const midi = start + index;
    const noteName = chromaticNotes[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    const noteId = toNoteId(noteName, octave);
    const target = targetById.get(noteId);
    const keyType = noteName.includes("#") ? "black" : "white";
    const highlightState: KeyHighlightState = target
      ? active.has(noteId)
        ? "correct"
        : "target"
      : "none";

    return {
      noteId,
      noteName,
      octave,
      keyType,
      displayLabel: `${noteName}${octave}`,
      highlightState,
      hand: target?.hand,
      finger: target?.finger,
      isTarget: Boolean(target)
    };
  });
};
