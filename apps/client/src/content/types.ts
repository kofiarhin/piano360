export type NoteName = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export type Hand = "left" | "right" | "both";

export type FingerNumber = 1 | 2 | 3 | 4 | 5;

export type ValidationMode = "manual" | "pitch" | "pitch-and-timing" | "midi";

export type ExerciseCategory =
  | "orientation"
  | "finger-numbers"
  | "intervals"
  | "triads"
  | "chord-transitions"
  | "progressions";

export type Difficulty = "beginner";

export type KeyboardRange = {
  startNote: NoteName;
  startOctave: number;
  endNote: NoteName;
  endOctave: number;
};

export type NoteTarget = {
  note: NoteName;
  octave: number;
  hand: Hand;
  finger: FingerNumber;
  role: string;
  displayLabel: string;
};

export type StepTiming = {
  bpm?: number;
  beats?: number;
  expectedDurationMs?: number;
  toleranceMs?: number;
};

export type PracticeStep = {
  id: string;
  instruction: string;
  targetNotes: NoteTarget[];
  expectedHand: Hand;
  skippable: boolean;
  validationModes: ValidationMode[];
  successFeedback: string;
  retryHint: string;
  timing?: StepTiming;
};

export type CompletionRule = {
  minimumCorrectSteps: number;
  allowSkips: boolean;
};

export type Exercise = {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  difficulty: Difficulty;
  estimatedMinutes: number;
  lessonId: string;
  skillIds: string[];
  keyboardRange: KeyboardRange;
  steps: PracticeStep[];
  completionRule: CompletionRule;
  validationModes: ValidationMode[];
  prerequisiteExerciseIds: string[];
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  level: "absolute-beginner";
  objective: string;
  exerciseIds: string[];
  skillIds: string[];
  order: number;
};

export type SkillGroup = "keyboard-geography" | "finger-control" | "harmony";

export type SkillMastery = "unseen" | "introduced" | "practicing" | "comfortable" | "mastered";

export type Skill = {
  id: string;
  title: string;
  description: string;
  group: SkillGroup;
  level: "beginner";
  masteryThreshold: number;
  prerequisiteSkillIds: string[];
};

export type NoteReference = {
  note: NoteName;
  octave: number;
  label: string;
  description: string;
  keyType: "white";
};

export type ChordReference = {
  id: string;
  title: string;
  quality: "major" | "minor";
  notes: NoteTarget[];
  description: string;
};

export type ScaleReference = {
  id: string;
  title: string;
  notes: NoteTarget[];
  description: string;
};

export type ProgressionReference = {
  id: string;
  title: string;
  numerals: string[];
  chords: string[];
  description: string;
};
