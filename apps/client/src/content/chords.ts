import type { ChordReference } from "./types";

export const chords: ChordReference[] = [
  {
    id: "c-major-triad",
    title: "C major triad",
    quality: "major",
    description: "C, E, and G create a bright stable home chord.",
    notes: [
      { note: "C", octave: 4, hand: "right", finger: 1, role: "root", displayLabel: "C" },
      { note: "E", octave: 4, hand: "right", finger: 3, role: "third", displayLabel: "E" },
      { note: "G", octave: 4, hand: "right", finger: 5, role: "fifth", displayLabel: "G" }
    ]
  },
  {
    id: "a-minor-triad",
    title: "A minor triad",
    quality: "minor",
    description: "A, C, and E create a darker three-note shape.",
    notes: [
      { note: "A", octave: 3, hand: "left", finger: 5, role: "root", displayLabel: "A" },
      { note: "C", octave: 4, hand: "left", finger: 3, role: "third", displayLabel: "C" },
      { note: "E", octave: 4, hand: "left", finger: 1, role: "fifth", displayLabel: "E" }
    ]
  },
  {
    id: "f-major-triad",
    title: "F major triad",
    quality: "major",
    description: "F, A, and C form the IV chord in C major.",
    notes: [
      { note: "F", octave: 3, hand: "left", finger: 5, role: "root", displayLabel: "F" },
      { note: "A", octave: 3, hand: "left", finger: 3, role: "third", displayLabel: "A" },
      { note: "C", octave: 4, hand: "left", finger: 1, role: "fifth", displayLabel: "C" }
    ]
  },
  {
    id: "g-major-triad",
    title: "G major triad",
    quality: "major",
    description: "G, B, and D form the V chord in C major.",
    notes: [
      { note: "G", octave: 3, hand: "left", finger: 5, role: "root", displayLabel: "G" },
      { note: "B", octave: 3, hand: "left", finger: 3, role: "third", displayLabel: "B" },
      { note: "D", octave: 4, hand: "left", finger: 1, role: "fifth", displayLabel: "D" }
    ]
  }
];
