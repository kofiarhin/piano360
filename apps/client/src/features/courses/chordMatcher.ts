import type { NoteId } from "./courseTypes";

export type ChordMatchResult = "pending" | "correct" | "incorrect";

const sameSet = (first: Set<NoteId>, second: Set<NoteId>) => {
  if (first.size !== second.size) {
    return false;
  }

  for (const value of first) {
    if (!second.has(value)) {
      return false;
    }
  }

  return true;
};

export const matchChordInput = (expectedNotes: NoteId[], collectedNotes: NoteId[]): ChordMatchResult => {
  const expected = new Set(expectedNotes);
  const collected = new Set(collectedNotes);

  for (const note of collected) {
    if (!expected.has(note)) {
      return "incorrect";
    }
  }

  if (sameSet(expected, collected)) {
    return "correct";
  }

  return "pending";
};
