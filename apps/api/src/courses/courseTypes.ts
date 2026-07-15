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
export const lessonModes = ["guided-steps", "timeline", "migration-blocked"] as const;
export const lessonContentKinds = [
  "foundational-drill",
  "rhythm-drill",
  "song-phrase",
  "complete-song"
] as const;
export const timelinePracticeModes = ["guided", "performance"] as const;
export const guidedInteractionModes = ["stop-and-wait", "assisted"] as const;
export const timingProfiles = ["generous", "standard", "strict"] as const;
export const timeSignatureDenominators = [2, 4, 8, 16] as const;
export const timelineTimingSources = ["instructional", "verified"] as const;
export const timelineSourceTypes = [
  "instructional-template",
  "midi",
  "sheet-music",
  "manual-transcription",
  "recorded-performance"
] as const;
export const timelineReviewStatuses = [
  "instructional",
  "unreviewed",
  "reviewed",
  "approved"
] as const;
export const migrationStatuses = [
  "legacy",
  "generated-instructional",
  "needs-transcription",
  "needs-review",
  "approved"
] as const;

export type NoteId = (typeof noteIds)[number];
export type ContentType = (typeof contentTypes)[number];
export type Hand = (typeof hands)[number];
export type Difficulty = (typeof difficulties)[number];
export type LessonStepType = (typeof stepTypes)[number];
export type LessonMode = (typeof lessonModes)[number];
export type LessonContentKind = (typeof lessonContentKinds)[number];
export type TimelinePracticeMode = (typeof timelinePracticeModes)[number];
export type GuidedInteractionMode = (typeof guidedInteractionModes)[number];
export type TimingProfile = (typeof timingProfiles)[number];
export type TimeSignatureDenominator = (typeof timeSignatureDenominators)[number];
export type TimelineTimingSource = (typeof timelineTimingSources)[number];
export type TimelineSourceType = (typeof timelineSourceTypes)[number];
export type TimelineReviewStatus = (typeof timelineReviewStatuses)[number];
export type MigrationStatus = (typeof migrationStatuses)[number];

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
  denominator: TimeSignatureDenominator;
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
  guidedInteractionMode?: GuidedInteractionMode;
  pauseOnMiss: boolean;
  enableTimingScore: boolean;
  timingProfile: TimingProfile;
  allowPerformanceMode: boolean;
};

export type GuidedStepLesson = LessonBase & {
  mode?: "guided-steps";
  steps: LessonStep[];
  timeline?: never;
};

export type TimelineLesson = LessonBase & {
  mode: "timeline";
  contentKind: LessonContentKind;
  defaultPracticeMode: TimelinePracticeMode;
  availablePracticeModes: TimelinePracticeMode[];
  behaviour: LessonBehaviour;
  steps?: never;
  timeline: SongTimeline;
};

export type MigrationBlockedLesson = LessonBase & {
  mode: "migration-blocked";
  contentKind: "song-phrase" | "complete-song";
  migrationStatus: Extract<MigrationStatus, "needs-transcription" | "needs-review">;
  unavailableReason: string;
  requiredTimingSource: string;
  legacySteps?: LessonStep[];
  steps?: never;
  timeline?: never;
};

export type Lesson = GuidedStepLesson | TimelineLesson | MigrationBlockedLesson;

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
