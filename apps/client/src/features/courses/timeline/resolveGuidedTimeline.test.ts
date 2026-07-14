import type { GuidedStepLessonDetail, TimelineLessonDetail } from "../courseTypes";
import { resolveGuidedTimeline } from "./resolveGuidedTimeline";

const guidedLesson: GuidedStepLessonDetail = {
  slug: "middle-c-anchor",
  title: "Middle C Anchor",
  description: "Find C4.",
  order: 1,
  isFinal: false,
  mode: "guided-steps",
  steps: [
    { id: "find-c4", type: "single-note", instruction: "Play C4.", targetNotes: ["C4"] },
    {
      id: "c-major",
      type: "chord",
      instruction: "Play C major.",
      targetNotes: ["C4", "E4", "G4"]
    }
  ],
  courseSlug: "finger-placement",
  courseTitle: "Finger Placement",
  courseHand: "right"
};

describe("resolveGuidedTimeline", () => {
  it("generates a stable timeline from guided steps", () => {
    const resolved = resolveGuidedTimeline(guidedLesson);

    expect(resolved.status).toBe("playable");
    if (resolved.status !== "playable") throw new Error("Expected playable timeline.");

    expect(resolved.timeline).toMatchObject({
      lessonId: "middle-c-anchor",
      source: "generated",
      originalBpm: 60,
      countInBeats: 4,
      timeSignature: { numerator: 4, denominator: 4 },
      totalBeats: 4
    });
    expect(resolved.timeline.events).toEqual([
      expect.objectContaining({
        id: "generated-find-c4",
        notes: ["C4"],
        startBeat: 0,
        durationBeats: 1
      }),
      expect.objectContaining({
        id: "generated-c-major",
        notes: ["C4", "E4", "G4"],
        startBeat: 2,
        durationBeats: 1
      })
    ]);
  });

  it("preserves authored timeline timing and ids exactly", () => {
    const authored: TimelineLessonDetail = {
      ...guidedLesson,
      mode: "timeline",
      contentKind: "song-phrase",
      steps: undefined as never,
      defaultPracticeMode: "guided",
      availablePracticeModes: ["guided"],
      behaviour: {
        defaultPracticeMode: "guided",
        pauseOnMiss: false,
        enableTimingScore: true,
        timingProfile: "standard",
        allowPerformanceMode: false
      },
      timeline: {
        schemaVersion: 2,
        timingSource: "verified",
        originalBpm: 92,
        timeSignature: { numerator: 3, denominator: 4 },
        countInBeats: 3,
        totalBeats: 8,
        events: [
          { id: "authored-1", type: "note", notes: ["D4"], startBeat: 1.5, durationBeats: 0.5 }
        ],
        source: { type: "manual-transcription", reviewStatus: "approved" }
      }
    };

    const resolved = resolveGuidedTimeline(authored);

    expect(resolved.status).toBe("playable");
    if (resolved.status !== "playable") throw new Error("Expected playable timeline.");
    expect(resolved.timeline).toMatchObject({
      source: "authored",
      originalBpm: 92,
      countInBeats: 3,
      totalBeats: 8,
      events: authored.timeline.events
    });
  });

  it("rejects empty generated lessons and duplicate chord notes", () => {
    expect(resolveGuidedTimeline({ ...guidedLesson, steps: [] })).toMatchObject({
      status: "invalid"
    });
    expect(
      resolveGuidedTimeline({
        ...guidedLesson,
        steps: [
          {
            id: "duplicate",
            type: "chord",
            instruction: "Duplicate C.",
            targetNotes: ["C4", "C4"]
          }
        ]
      })
    ).toMatchObject({ status: "invalid" });
  });
});
