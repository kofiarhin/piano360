import {
  isGuidedStepLesson,
  isMigrationBlockedLesson,
  isTimelineLesson,
  type GuidedStepLessonDetail,
  type LessonDetail,
  type MigrationBlockedLesson,
  type TimelineLessonDetail
} from "../courseTypes";
import { legacyStepsToInstructionalTimeline } from "./legacyStepsToInstructionalTimeline";

const foundationalCourseSlugs = new Set(["finger-placement", "beginner-chords"]);

export type ResolvedTimelineLesson =
  | {
      status: "playable";
      lesson: TimelineLessonDetail;
      source: "native" | "legacy-instructional-adapter";
    }
  | {
      status: "blocked";
      lesson: MigrationBlockedLesson &
        Pick<LessonDetail, "courseSlug" | "courseTitle" | "courseHand">;
      reason: string;
    }
  | {
      status: "unsupported";
      reason: string;
    };

const blockLegacySongLesson = (
  lesson: GuidedStepLessonDetail
): ResolvedTimelineLesson & { status: "blocked" } => ({
  status: "blocked",
  reason:
    "Verified timing source required before this song lesson can use production timeline playback.",
  lesson: {
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    isFinal: lesson.isFinal,
    courseSlug: lesson.courseSlug,
    courseTitle: lesson.courseTitle,
    courseHand: lesson.courseHand,
    mode: "migration-blocked",
    contentKind: lesson.isFinal ? "complete-song" : "song-phrase",
    migrationStatus: "needs-transcription",
    unavailableReason:
      "This lesson only has ordered prompts. It needs approved beat positions, note durations, BPM, time signature, and source provenance.",
    requiredTimingSource:
      "Approved MIDI, sheet music, reviewed manual transcription, or reviewed recorded-performance timing is required."
  }
});

export const resolveLessonToTimeline = (lesson: LessonDetail): ResolvedTimelineLesson => {
  if (isTimelineLesson(lesson)) {
    return { status: "playable", lesson, source: "native" };
  }

  if (isMigrationBlockedLesson(lesson)) {
    return {
      status: "blocked",
      lesson,
      reason: lesson.unavailableReason
    };
  }

  if (isGuidedStepLesson(lesson)) {
    if (foundationalCourseSlugs.has(lesson.courseSlug)) {
      return {
        status: "playable",
        lesson: legacyStepsToInstructionalTimeline(lesson),
        source: "legacy-instructional-adapter"
      };
    }

    return blockLegacySongLesson(lesson);
  }

  return {
    status: "unsupported",
    reason: "Lesson data is missing a supported timeline or migration state."
  };
};

export const isLessonPlayableInPhaseA = (
  courseSlug: string,
  lesson: LessonDetail | { mode?: string; contentKind?: string }
) =>
  lesson.mode === "timeline" ||
  (lesson.mode !== "migration-blocked" &&
    lesson.mode !== "timeline" &&
    foundationalCourseSlugs.has(courseSlug));
