import type { GuidedStepLessonDetail, MigrationBlockedLesson } from "../courseTypes";
import { resolveLessonToTimeline } from "./resolveLessonToTimeline";

const guidedLesson: GuidedStepLessonDetail = {
  slug: "middle-c-anchor",
  title: "Middle C Anchor",
  description: "Find C4.",
  order: 1,
  isFinal: false,
  mode: "guided-steps",
  steps: [
    {
      id: "find-c4",
      type: "single-note",
      instruction: "Play C4.",
      targetNotes: ["C4"]
    }
  ],
  courseSlug: "finger-placement",
  courseTitle: "Finger Placement",
  courseHand: "right"
};

describe("resolveLessonToTimeline", () => {
  it("converts legacy foundational records into instructional timelines", () => {
    const resolved = resolveLessonToTimeline(guidedLesson);

    expect(resolved.status).toBe("playable");
    if (resolved.status !== "playable") {
      throw new Error("Expected playable lesson.");
    }

    expect(resolved.source).toBe("legacy-instructional-adapter");
    expect(resolved.lesson).toMatchObject({
      mode: "timeline",
      contentKind: "foundational-drill",
      timeline: {
        timingSource: "instructional",
        source: {
          type: "instructional-template",
          reviewStatus: "instructional"
        },
        events: [
          {
            id: "find-c4",
            notes: ["C4"],
            startBeat: 0,
            durationBeats: 1
          }
        ]
      }
    });
  });

  it("blocks legacy song records instead of fabricating rhythm", () => {
    const resolved = resolveLessonToTimeline({
      ...guidedLesson,
      courseSlug: "one-love-limited-excerpt",
      slug: "one-love-rise",
      title: "Rising Phrase"
    });

    expect(resolved.status).toBe("blocked");
    if (resolved.status !== "blocked") {
      throw new Error("Expected blocked lesson.");
    }

    expect(resolved.lesson).toMatchObject({
      mode: "migration-blocked",
      contentKind: "song-phrase",
      migrationStatus: "needs-transcription"
    });
  });

  it("returns native blocked lessons unchanged", () => {
    const blocked: MigrationBlockedLesson & {
      courseSlug: string;
      courseTitle: string;
      courseHand: "right";
    } = {
      slug: "blocked",
      title: "Blocked",
      description: "Needs timing.",
      order: 1,
      isFinal: false,
      courseSlug: "song",
      courseTitle: "Song",
      courseHand: "right",
      mode: "migration-blocked",
      contentKind: "song-phrase",
      migrationStatus: "needs-transcription",
      unavailableReason: "Timing source required.",
      requiredTimingSource: "Approved timing source required."
    };

    expect(resolveLessonToTimeline(blocked)).toMatchObject({
      status: "blocked",
      lesson: blocked
    });
  });
});
