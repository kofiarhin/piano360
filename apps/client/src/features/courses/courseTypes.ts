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
export type LessonMode = "guided-steps" | "timeline" | "migration-blocked";
export type LessonContentKind =
  "foundational-drill" | "rhythm-drill" | "song-phrase" | "complete-song";
export type TimelinePracticeMode = "guided" | "performance";
export type TimingProfile = "generous" | "standard" | "strict";
export type TimelineTimingSource = "instructional" | "verified";
export type TimelineSourceType =
  | "instructional-template"
  | "midi"
  | "sheet-music"
  | "manual-transcription"
  | "recorded-performance";
export type TimelineReviewStatus = "instructional" | "unreviewed" | "reviewed" | "approved";
export type MigrationStatus =
  "legacy" | "generated-instructional" | "needs-transcription" | "needs-review" | "approved";

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
  contentKind?: LessonContentKind;
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
  instruction?: string;
  fingerNumbers?: number[];
};

export type TimedRestEvent = {
  id: string;
  type: "rest";
  startBeat: number;
  durationBeats: number;
  instruction?: string;
};

export type TimelineEvent = TimedNoteEvent | TimedRestEvent;

export type TimingWindows = {
  perfectMs: number;
  goodMs: number;
  acceptedMs: number;
};

export type InstructionalTimingTemplate = {
  templateId: string;
  eventSpacingBeats: number;
  noteDurationBeats: number;
  firstEventBeat: number;
  restBetweenGroupsBeats?: number;
  originalBpm: number;
  countInBeats: number;
  timingWindows: TimingWindows;
};

export type TimelineSourceMetadata = {
  type: TimelineSourceType;
  reference?: string;
  importedAt?: string;
  importedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewStatus: TimelineReviewStatus;
};

export type SongTimeline = {
  schemaVersion: 2;
  timingSource: TimelineTimingSource;
  originalBpm: number;
  timeSignature: TimeSignature;
  countInBeats: number;
  totalBeats: number;
  pickupBeats?: number;
  events: TimelineEvent[];
  source: TimelineSourceMetadata;
  instructionalTemplate?: InstructionalTimingTemplate;
};

export type LessonBehaviour = {
  defaultPracticeMode: TimelinePracticeMode;
  pauseOnMiss: boolean;
  enableTimingScore: boolean;
  timingProfile: TimingProfile;
  allowPerformanceMode: boolean;
};

export type Lesson = LessonBase & {
  mode?: LessonMode;
  steps?: LessonStep[];
  timeline?: SongTimeline;
  defaultPracticeMode?: TimelinePracticeMode;
  availablePracticeModes?: TimelinePracticeMode[];
  behaviour?: LessonBehaviour;
  migrationStatus?: MigrationStatus;
  unavailableReason?: string;
  requiredTimingSource?: string;
  legacySteps?: LessonStep[];
};

export type GuidedStepLesson = Lesson & {
  mode?: "guided-steps";
  steps: LessonStep[];
};

export type TimelineLesson = Lesson & {
  mode: "timeline";
  contentKind: LessonContentKind;
  timeline: SongTimeline;
  defaultPracticeMode: TimelinePracticeMode;
  availablePracticeModes: TimelinePracticeMode[];
  behaviour: LessonBehaviour;
  steps?: never;
};

export type MigrationBlockedLesson = Lesson & {
  mode: "migration-blocked";
  contentKind: "song-phrase" | "complete-song";
  migrationStatus: Extract<MigrationStatus, "needs-transcription" | "needs-review">;
  unavailableReason: string;
  requiredTimingSource: string;
  timeline?: never;
  steps?: never;
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

export const isMigrationBlockedLesson = (lesson: Lesson): lesson is MigrationBlockedLesson =>
  lesson.mode === "migration-blocked";

export type CourseFilters = {
  contentType?: ContentType;
  hand?: Hand;
  difficulty?: Difficulty;
};

const noteIdSet = new Set<string>(noteIds);

export const isNoteId = (value: unknown): value is NoteId =>
  typeof value === "string" && noteIdSet.has(value);
