import { seedCourses } from "../courses/seedCourses";
import { auditSongTimelines } from "../courses/songTimelineAudit";

const records = auditSongTimelines(seedCourses);
const ready = records.filter((record) => record.migrationStatus === "ready").length;
const needsTranscription = records.filter(
  (record) => record.migrationStatus === "needs-transcription"
).length;

process.stdout.write(
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      requestedCatalogueSize: 50,
      actualCatalogueSize: records.length,
      summary: { ready, needsTranscription },
      records
    },
    null,
    2
  )}\n`
);
