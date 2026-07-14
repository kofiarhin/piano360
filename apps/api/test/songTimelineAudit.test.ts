import { auditSongTimelines } from "../src/courses/songTimelineAudit";
import { seedCourses } from "../src/courses/seedCourses";

describe("song timeline audit", () => {
  it("classifies every seeded course without inventing rhythm", () => {
    const audit = auditSongTimelines(seedCourses);

    expect(audit.length).toBeGreaterThan(seedCourses.length);
    expect(audit.find((record) => record.lessonSlug === "complete-ode-to-joy")).toMatchObject({
      migrationStatus: "ready",
      sourceType: "manual-transcription",
      hasBpm: true,
      hasBeatPositions: true,
      hasDurations: true
    });
    expect(audit.find((record) => record.lessonSlug === "ode-first-phrase")).toMatchObject({
      migrationStatus: "needs-transcription",
      sourceType: "note-list"
    });
    expect(
      audit
        .filter((record) => record.lessonSlug !== "complete-ode-to-joy")
        .every((record) => record.migrationStatus === "needs-transcription")
    ).toBe(true);
  });
});
