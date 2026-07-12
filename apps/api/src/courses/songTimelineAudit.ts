import type { Course } from "./courseTypes";

export type SongAuditRecord = {
  songId: string;
  title: string;
  currentEventCount: number;
  hasBpm: boolean;
  hasTimeSignature: boolean;
  hasBeatPositions: boolean;
  hasDurations: boolean;
  sourceType: "midi" | "sheet-music" | "manual" | "note-list" | "unknown";
  migrationStatus: "ready" | "needs-review" | "needs-transcription" | "blocked";
  issues: string[];
};

export const auditSongTimelines = (courses: Course[]): SongAuditRecord[] =>
  courses.map((course) => {
    const finalLesson = [...course.lessons]
      .sort((first, second) => first.order - second.order)
      .find((lesson) => lesson.isFinal);

    if (!finalLesson) {
      return {
        songId: course.slug,
        title: course.title,
        currentEventCount: 0,
        hasBpm: false,
        hasTimeSignature: false,
        hasBeatPositions: false,
        hasDurations: false,
        sourceType: "unknown",
        migrationStatus: "blocked",
        issues: ["Course has no final lesson."]
      };
    }

    if (finalLesson.mode === "timeline") {
      return {
        songId: course.slug,
        title: course.title,
        currentEventCount: finalLesson.timeline.events.length,
        hasBpm: true,
        hasTimeSignature: true,
        hasBeatPositions: finalLesson.timeline.events.every((event) => event.startBeat >= 0),
        hasDurations: finalLesson.timeline.events.every((event) => event.durationBeats > 0),
        sourceType: "manual",
        migrationStatus: "ready",
        issues: []
      };
    }

    return {
      songId: course.slug,
      title: course.title,
      currentEventCount: finalLesson.steps.length,
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
    };
  });
