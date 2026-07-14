import type { Course } from "./courseTypes";

export type SongAuditRecord = {
  courseSlug: string;
  lessonSlug: string;
  title: string;
  contentKind: "song-phrase" | "complete-song";
  existingMode: "timeline" | "migration-blocked" | "guided-steps";
  currentEventCount: number;
  hasBpm: boolean;
  hasTimeSignature: boolean;
  hasBeatPositions: boolean;
  hasDurations: boolean;
  sourceType:
    | "midi"
    | "sheet-music"
    | "manual-transcription"
    | "recorded-performance"
    | "instructional-template"
    | "note-list"
    | "unknown";
  migrationStatus: "ready" | "needs-review" | "needs-transcription" | "blocked";
  issues: string[];
};

export const auditSongTimelines = (courses: Course[]): SongAuditRecord[] =>
  courses.flatMap((course) =>
    [...course.lessons]
      .sort((first, second) => first.order - second.order)
      .flatMap((lesson): SongAuditRecord[] => {
        const contentKind =
          lesson.contentKind ??
          (course.slug === "finger-placement" || course.slug === "beginner-chords"
            ? "foundational-drill"
            : lesson.isFinal
              ? "complete-song"
              : "song-phrase");

        if (contentKind !== "song-phrase" && contentKind !== "complete-song") {
          return [];
        }

        if (lesson.mode === "timeline") {
          const approved =
            lesson.timeline.timingSource === "verified" &&
            lesson.timeline.source.reviewStatus === "approved";
          return [
            {
              courseSlug: course.slug,
              lessonSlug: lesson.slug,
              title: `${course.title} / ${lesson.title}`,
              contentKind,
              existingMode: "timeline",
              currentEventCount: lesson.timeline.events.length,
              hasBpm: Number.isFinite(lesson.timeline.originalBpm),
              hasTimeSignature: Boolean(lesson.timeline.timeSignature),
              hasBeatPositions: lesson.timeline.events.every((event) => event.startBeat >= 0),
              hasDurations: lesson.timeline.events.every((event) => event.durationBeats > 0),
              sourceType: lesson.timeline.source.type,
              migrationStatus: approved ? "ready" : "needs-review",
              issues: approved ? [] : ["Timeline exists but does not have approved provenance."]
            }
          ];
        }

        if (lesson.mode === "migration-blocked") {
          return [
            {
              courseSlug: course.slug,
              lessonSlug: lesson.slug,
              title: `${course.title} / ${lesson.title}`,
              contentKind,
              existingMode: "migration-blocked",
              currentEventCount: lesson.legacySteps?.length ?? 0,
              hasBpm: false,
              hasTimeSignature: false,
              hasBeatPositions: false,
              hasDurations: false,
              sourceType: "note-list",
              migrationStatus: lesson.migrationStatus,
              issues: [lesson.unavailableReason, lesson.requiredTimingSource]
            }
          ];
        }

        return [
          {
            courseSlug: course.slug,
            lessonSlug: lesson.slug,
            title: `${course.title} / ${lesson.title}`,
            contentKind,
            existingMode: "guided-steps",
            currentEventCount: lesson.steps.length,
            hasBpm: false,
            hasTimeSignature: false,
            hasBeatPositions: false,
            hasDurations: false,
            sourceType: "note-list",
            migrationStatus: "needs-transcription",
            issues: [
              "Only ordered note or chord prompts are available.",
              "Authoritative rhythm must come from MIDI, notation, or reviewed manual transcription."
            ]
          }
        ];
      })
  );
