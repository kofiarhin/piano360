export const noteIds = [
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5"
] as const;

export const contentTypes = ["single-note", "chord", "mixed"] as const;
export const hands = ["left", "right"] as const;
export const difficulties = ["beginner"] as const;
export const stepTypes = ["single-note", "chord"] as const;

export type NoteId = (typeof noteIds)[number];
export type ContentType = (typeof contentTypes)[number];
export type Hand = (typeof hands)[number];
export type Difficulty = (typeof difficulties)[number];
export type LessonStepType = (typeof stepTypes)[number];

export type LessonStep = {
  id: string;
  type: LessonStepType;
  instruction: string;
  targetNotes: NoteId[];
};

export type Lesson = {
  slug: string;
  title: string;
  description: string;
  order: number;
  isFinal: boolean;
  steps: LessonStep[];
};

export type Course = {
  slug: string;
  title: string;
  description: string;
  contentType: ContentType;
  hand: Hand;
  difficulty: Difficulty;
  order: number;
  lessons: Lesson[];
};

export type CourseFilters = {
  contentType?: ContentType;
  hand?: Hand;
  difficulty?: Difficulty;
};

export type CourseSummary = Omit<Course, "lessons"> & {
  lessonCount: number;
};

export type LessonDetail = Lesson & {
  courseSlug: string;
  courseTitle: string;
  courseHand: Hand;
};
