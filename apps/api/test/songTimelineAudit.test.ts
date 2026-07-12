import { auditSongTimelines } from "../src/courses/songTimelineAudit";
import { seedCourses } from "../src/courses/seedCourses";

describe("song timeline audit", () => {
  it("classifies every seeded course without inventing rhythm", () => {
    const audit = auditSongTimelines(seedCourses);

    expect(audit).toHaveLength(seedCourses.length);
    expect(audit.find((record) => record.songId === "ode-to-joy")).toMatchObject({
      migrationStatus: "ready",
      hasBpm: true,
      hasBeatPositions: true,
      hasDurations: true
    });
    expect(
      audit
        .filter((record) => record.songId !== "ode-to-joy")
        .every((record) => record.migrationStatus === "needs-transcription")
    ).toBe(true);
  });
});
