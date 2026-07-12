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

export type NoteId = (typeof noteIds)[number];
export type ContentType = "single-note" | "chord" | "mixed";
export type Hand = "left" | "right";
export type Difficulty = "beginner";
export type LessonStepType = "single-note" | "chord";
export type LessonMode = "guided-steps" | "timeline";
export type TimelinePracticeMode = "guided" | "performance";

export type LessonStep = {
  id: string;
  type: LessonStepType;
  instruction: string;
  targetNotes: NoteId[];
};

type LessonBase = {
  slug: string;
  title: string;
  description: string;
  order: number;
  isFinal: boolean;
};

export type TimeSignature = {
  numerator: number;
  denominator: 2 | 4 | 8 | 16;
};

export type TimedNoteEvent = {
  id: string;
  type: "note";
  notes: NoteId[];
  startBeat: number;
  durationBeats: number;
  hand?: "left" | "right" | "both";
  velocity?: number;
};

export type TimedRestEvent = {
  id: string;
  type: "rest";
  startBeat: number;
  durationBeats: number;
};

export type TimelineEvent = TimedNoteEvent | TimedRestEvent;

export type SongTimeline = {
  originalBpm: number;
  timeSignature: TimeSignature;
  countInBeats: number;
  totalBeats: number;
  events: TimelineEvent[];
};

export type Lesson = LessonBase & {
  mode?: LessonMode;
  steps?: LessonStep[];
  timeline?: SongTimeline;
};

export type GuidedStepLesson = Lesson & {
  mode?: "guided-steps";
  steps: LessonStep[];
};

export type TimelineLesson = Lesson & {
  mode: "timeline";
  timeline: SongTimeline;
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

export type CourseSummary = Omit<Course, "lessons"> & {
  lessonCount: number;
};

export type LessonDetail = Lesson & {
  courseSlug: string;
  courseTitle: string;
  courseHand: Hand;
};

export type GuidedStepLessonDetail = GuidedStepLesson & {
  courseSlug: string;
  courseTitle: string;
  courseHand: Hand;
};

export type TimelineLessonDetail = TimelineLesson & {
  courseSlug: string;
  courseTitle: string;
  courseHand: Hand;
};

export const isTimelineLesson = (lesson: Lesson): lesson is TimelineLesson =>
  lesson.mode === "timeline" && lesson.timeline !== undefined;

export const isGuidedStepLesson = (lesson: Lesson): lesson is GuidedStepLesson =>
  lesson.mode !== "timeline" && lesson.steps !== undefined;

export type CourseFilters = {
  contentType?: ContentType;
  hand?: Hand;
  difficulty?: Difficulty;
};

const noteIdSet = new Set<string>(noteIds);

export const isNoteId = (value: unknown): value is NoteId =>
  typeof value === "string" && noteIdSet.has(value);
