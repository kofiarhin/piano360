import type { Skill } from "./types";

export const skills: Skill[] = [
  {
    id: "middle-c-orientation",
    title: "Middle C orientation",
    description: "Find middle C and use it as the keyboard landmark.",
    group: "keyboard-geography",
    level: "beginner",
    masteryThreshold: 0.8,
    prerequisiteSkillIds: []
  },
  {
    id: "white-key-geography",
    title: "White-key geography",
    description: "Recognize neighboring white keys around middle C.",
    group: "keyboard-geography",
    level: "beginner",
    masteryThreshold: 0.75,
    prerequisiteSkillIds: ["middle-c-orientation"]
  },
  {
    id: "right-hand-finger-numbers",
    title: "Right-hand finger numbers",
    description: "Map right-hand fingers 1 through 5 to nearby keys.",
    group: "finger-control",
    level: "beginner",
    masteryThreshold: 0.75,
    prerequisiteSkillIds: ["middle-c-orientation"]
  },
  {
    id: "left-hand-finger-numbers",
    title: "Left-hand finger numbers",
    description: "Map left-hand fingers 1 through 5 to nearby keys.",
    group: "finger-control",
    level: "beginner",
    masteryThreshold: 0.75,
    prerequisiteSkillIds: ["middle-c-orientation"]
  },
  {
    id: "interval-shapes",
    title: "Seconds and thirds",
    description: "Feel stepwise motion and skips without looking down.",
    group: "keyboard-geography",
    level: "beginner",
    masteryThreshold: 0.75,
    prerequisiteSkillIds: ["white-key-geography", "right-hand-finger-numbers"]
  },
  {
    id: "fourths-and-fifths",
    title: "Fourths and fifths",
    description: "Recognize wider beginner intervals by shape.",
    group: "keyboard-geography",
    level: "beginner",
    masteryThreshold: 0.7,
    prerequisiteSkillIds: ["interval-shapes"]
  },
  {
    id: "major-triad-shape",
    title: "Major triad shape",
    description: "Play the C major triad as a stable three-note shape.",
    group: "harmony",
    level: "beginner",
    masteryThreshold: 0.75,
    prerequisiteSkillIds: ["interval-shapes"]
  },
  {
    id: "minor-triad-shape",
    title: "Minor triad shape",
    description: "Compare the A minor triad against a major shape.",
    group: "harmony",
    level: "beginner",
    masteryThreshold: 0.75,
    prerequisiteSkillIds: ["major-triad-shape"]
  },
  {
    id: "chord-transition-control",
    title: "Chord transition control",
    description: "Move between simple triad shapes with calm hands.",
    group: "harmony",
    level: "beginner",
    masteryThreshold: 0.7,
    prerequisiteSkillIds: ["major-triad-shape", "minor-triad-shape"]
  },
  {
    id: "basic-progression-memory",
    title: "I-IV-V-I memory",
    description: "Understand the sound and movement of a basic I-IV-V-I path.",
    group: "harmony",
    level: "beginner",
    masteryThreshold: 0.7,
    prerequisiteSkillIds: ["chord-transition-control"]
  }
];
