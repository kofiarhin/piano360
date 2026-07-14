import { seedCourses } from "../courses/seedCourses";
import { auditSongTimelines } from "../courses/songTimelineAudit";

const records = auditSongTimelines(seedCourses);
const ready = records.filter((record) => record.migrationStatus === "ready").length;
const needsTranscription = records.filter(
  (record) => record.migrationStatus === "needs-transcription"
).length;
const needsReview = records.filter((record) => record.migrationStatus === "needs-review").length;
const blocked = records.filter((record) => record.migrationStatus === "blocked").length;

process.stdout.write(
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      auditedSongLessonCount: records.length,
      summary: { ready, needsTranscription, needsReview, blocked },
      records
    },
    null,
    2
  )}\n`
);
