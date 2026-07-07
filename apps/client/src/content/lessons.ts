import type { Lesson } from "./types";

export const lessons: Lesson[] = [
  {
    id: "lesson-middle-c-map",
    title: "Find the center",
    description: "Start with middle C, nearby white keys, and the two hands.",
    level: "absolute-beginner",
    objective: "Build a reliable physical map around middle C.",
    exerciseIds: ["middle-c-anchor", "right-hand-five-fingers", "left-hand-five-fingers"],
    skillIds: [
      "middle-c-orientation",
      "white-key-geography",
      "right-hand-finger-numbers",
      "left-hand-finger-numbers"
    ],
    order: 1
  },
  {
    id: "lesson-beginner-intervals",
    title: "Move by shape",
    description: "Practice seconds, thirds, fourths, and fifths as distances.",
    level: "absolute-beginner",
    objective: "Recognize small keyboard distances without counting every key.",
    exerciseIds: ["step-and-skip-drill", "fourth-fifth-reach"],
    skillIds: ["interval-shapes", "fourths-and-fifths"],
    order: 2
  },
  {
    id: "lesson-first-triads",
    title: "First chord shapes",
    description: "Use triads and basic transitions to connect harmony with finger shapes.",
    level: "absolute-beginner",
    objective: "Play simple three-note chords and a basic I-IV-V-I idea.",
    exerciseIds: ["c-major-triad-shape", "a-minor-triad-shape", "basic-i-iv-v-i"],
    skillIds: [
      "major-triad-shape",
      "minor-triad-shape",
      "chord-transition-control",
      "basic-progression-memory"
    ],
    order: 3
  }
];
