import { auditSongTimelines } from "../src/courses/songTimelineAudit";
import { seedCourses } from "../src/courses/seedCourses";

describe("song timeline audit", () => {
  it("classifies every seeded course without inventing rhythm", () => {
    const audit = auditSongTimelines(seedCourses);
    const preparedLessonSlugs = new Set([
      "ode-first-phrase",
      "ode-answer-phrase",
      "complete-ode-to-joy",
      "three-little-birds-lift",
      "three-little-birds-answer",
      "complete-three-little-birds-excerpt",
      "rivers-of-babylon-call",
      "rivers-of-babylon-answer",
      "complete-rivers-of-babylon-excerpt",
      "island-sunrise-opening",
      "island-sunrise-middle",
      "island-sunrise-close",
      "complete-island-sunrise"
    ]);

    expect(audit.length).toBeGreaterThan(seedCourses.length);
    for (const lessonSlug of preparedLessonSlugs) {
      expect(audit.find((record) => record.lessonSlug === lessonSlug)).toMatchObject({
        migrationStatus: "ready",
        sourceType: "manual-transcription",
        hasBpm: true,
        hasBeatPositions: true,
        hasDurations: true
      });
    }
    expect(
      audit
        .filter((record) => !preparedLessonSlugs.has(record.lessonSlug))
        .every((record) => record.migrationStatus === "needs-transcription")
    ).toBe(true);
  });
});
