import type { NoteReference } from "./types";

export const notes: NoteReference[] = [
  {
    note: "C",
    octave: 4,
    label: "Middle C",
    description: "The anchor note near the center of the piano.",
    keyType: "white"
  },
  {
    note: "D",
    octave: 4,
    label: "D above middle C",
    description: "One white key to the right of middle C.",
    keyType: "white"
  },
  {
    note: "E",
    octave: 4,
    label: "E above middle C",
    description: "Two white keys to the right of middle C.",
    keyType: "white"
  },
  {
    note: "F",
    octave: 4,
    label: "F above middle C",
    description: "The first white key after the group of two black keys.",
    keyType: "white"
  },
  {
    note: "G",
    octave: 4,
    label: "G above middle C",
    description: "A common right-hand five-finger position note.",
    keyType: "white"
  },
  {
    note: "A",
    octave: 3,
    label: "A below middle C",
    description: "A left-hand anchor for the A minor shape.",
    keyType: "white"
  },
  {
    note: "B",
    octave: 3,
    label: "B below middle C",
    description: "One white key below middle C.",
    keyType: "white"
  }
];
