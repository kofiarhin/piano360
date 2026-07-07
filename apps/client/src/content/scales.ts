import type { ScaleReference } from "./types";

export const scales: ScaleReference[] = [
  {
    id: "c-five-finger-position",
    title: "C five-finger position",
    description: "Right-hand fingers rest on C, D, E, F, and G.",
    notes: [
      { note: "C", octave: 4, hand: "right", finger: 1, role: "position", displayLabel: "C" },
      { note: "D", octave: 4, hand: "right", finger: 2, role: "position", displayLabel: "D" },
      { note: "E", octave: 4, hand: "right", finger: 3, role: "position", displayLabel: "E" },
      { note: "F", octave: 4, hand: "right", finger: 4, role: "position", displayLabel: "F" },
      { note: "G", octave: 4, hand: "right", finger: 5, role: "position", displayLabel: "G" }
    ]
  },
  {
    id: "left-c-position",
    title: "Left-hand C position",
    description: "Left-hand fingers rest on C, D, E, F, and G below middle C.",
    notes: [
      { note: "C", octave: 3, hand: "left", finger: 5, role: "position", displayLabel: "C" },
      { note: "D", octave: 3, hand: "left", finger: 4, role: "position", displayLabel: "D" },
      { note: "E", octave: 3, hand: "left", finger: 3, role: "position", displayLabel: "E" },
      { note: "F", octave: 3, hand: "left", finger: 2, role: "position", displayLabel: "F" },
      { note: "G", octave: 3, hand: "left", finger: 1, role: "position", displayLabel: "G" }
    ]
  }
];
