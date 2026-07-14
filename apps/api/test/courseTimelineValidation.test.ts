import { courseSchema } from "../src/courses/courseValidation";

const baseCourse = {
  slug: "rhythm-course",
  title: "Rhythm Course",
  description: "A timing-aware course.",
  contentType: "single-note" as const,
  hand: "right" as const,
  difficulty: "beginner" as const,
  order: 1
};

describe("timeline lesson validation", () => {
  it("defaults existing step lessons to guided-steps mode", () => {
    const course = courseSchema.parse({
      ...baseCourse,
      lessons: [
        {
          slug: "guided",
          title: "Guided",
          description: "Waits for the learner.",
          order: 1,
          isFinal: true,
          steps: [
            {
              id: "play-c4",
              type: "single-note",
              instruction: "Play C4.",
              targetNotes: ["C4"]
            }
          ]
        }
      ]
    });

    expect(course.lessons[0]?.mode).toBe("guided-steps");
  });

  it("accepts a beat-based timeline lesson", () => {
    const course = courseSchema.parse({
      ...baseCourse,
      lessons: [
        {
          slug: "timeline",
          title: "Timeline",
          description: "Plays against a transport.",
          order: 1,
          isFinal: true,
          mode: "timeline",
          timeline: {
            schemaVersion: 2,
            timingSource: "verified",
            originalBpm: 120,
            timeSignature: { numerator: 4, denominator: 4 },
            countInBeats: 4,
            totalBeats: 4,
            events: [
              {
                id: "event-c4",
                type: "note",
                notes: ["C4"],
                startBeat: 0,
                durationBeats: 1,
                hand: "right"
              },
              { id: "rest", type: "rest", startBeat: 1, durationBeats: 1 },
              {
                id: "event-e4-g4",
                type: "note",
                notes: ["E4", "G4"],
                startBeat: 2,
                durationBeats: 2,
                hand: "right",
                velocity: 0.75
              }
            ],
            source: {
              type: "manual-transcription",
              reviewStatus: "approved"
            }
          },
          contentKind: "complete-song",
          defaultPracticeMode: "guided",
          availablePracticeModes: ["guided", "performance"],
          behaviour: {
            defaultPracticeMode: "guided",
            pauseOnMiss: true,
            enableTimingScore: true,
            timingProfile: "standard",
            allowPerformanceMode: true
          }
        }
      ]
    });

    expect(course.lessons[0]?.timeline?.events).toHaveLength(3);
  });

  it("rejects timelines with events beyond totalBeats", () => {
    expect(() =>
      courseSchema.parse({
        ...baseCourse,
        lessons: [
          {
            slug: "invalid-timeline",
            title: "Invalid timeline",
            description: "Ends too early.",
            order: 1,
            isFinal: true,
            mode: "timeline",
            timeline: {
              schemaVersion: 2,
              timingSource: "verified",
              originalBpm: 100,
              timeSignature: { numerator: 4, denominator: 4 },
              countInBeats: 0,
              totalBeats: 1,
              events: [
                {
                  id: "event-c4",
                  type: "note",
                  notes: ["C4"],
                  startBeat: 0,
                  durationBeats: 2
                }
              ],
              source: {
                type: "manual-transcription",
                reviewStatus: "approved"
              }
            },
            contentKind: "complete-song",
            defaultPracticeMode: "guided",
            availablePracticeModes: ["guided", "performance"],
            behaviour: {
              defaultPracticeMode: "guided",
              pauseOnMiss: true,
              enableTimingScore: true,
              timingProfile: "standard",
              allowPerformanceMode: true
            }
          }
        ]
      })
    ).toThrow(/totalBeats/);
  });

  it("requires exactly one content model per lesson mode", () => {
    expect(() =>
      courseSchema.parse({
        ...baseCourse,
        lessons: [
          {
            slug: "missing-content",
            title: "Missing content",
            description: "Has no steps.",
            order: 1,
            isFinal: true,
            mode: "guided-steps"
          }
        ]
      })
    ).toThrow(/steps/);
  });

  it("accepts instructional song practice timelines when provenance is honest", () => {
    const course = courseSchema.parse({
      ...baseCourse,
      lessons: [
        {
          slug: "instructional-song",
          title: "Instructional Song",
          description: "Uses curriculum-authored practice timing.",
          order: 1,
          isFinal: true,
          mode: "timeline",
          contentKind: "complete-song",
          defaultPracticeMode: "guided",
          availablePracticeModes: ["guided", "performance"],
          behaviour: {
            defaultPracticeMode: "guided",
            pauseOnMiss: true,
            enableTimingScore: true,
            timingProfile: "standard",
            allowPerformanceMode: true
          },
          timeline: {
            schemaVersion: 2,
            timingSource: "instructional",
            originalBpm: 80,
            timeSignature: { numerator: 4, denominator: 4 },
            countInBeats: 4,
            totalBeats: 2,
            events: [
              {
                id: "event-c4",
                type: "note",
                notes: ["C4"],
                startBeat: 0,
                durationBeats: 1
              }
            ],
            source: {
              type: "instructional-template",
              reference: "unified-song-practice-v1",
              reviewStatus: "instructional"
            },
            instructionalTemplate: {
              templateId: "unified-song-practice-v1",
              eventSpacingBeats: 1,
              noteDurationBeats: 0.75,
              firstEventBeat: 0,
              originalBpm: 80,
              countInBeats: 4,
              timingWindows: { perfectMs: 140, goodMs: 280, acceptedMs: 520 }
            }
          }
        }
      ]
    });

    expect(course.lessons[0]?.timeline?.timingSource).toBe("instructional");
  });

  it("rejects verified song timelines without approved provenance", () => {
    expect(() =>
      courseSchema.parse({
        ...baseCourse,
        lessons: [
          {
            slug: "unapproved-song",
            title: "Unapproved Song",
            description: "Missing approved timing.",
            order: 1,
            isFinal: true,
            mode: "timeline",
            contentKind: "complete-song",
            defaultPracticeMode: "guided",
            availablePracticeModes: ["guided"],
            behaviour: {
              defaultPracticeMode: "guided",
              pauseOnMiss: true,
              enableTimingScore: false,
              timingProfile: "generous",
              allowPerformanceMode: false
            },
            timeline: {
              schemaVersion: 2,
              timingSource: "verified",
              originalBpm: 60,
              timeSignature: { numerator: 4, denominator: 4 },
              countInBeats: 4,
              totalBeats: 2,
              events: [
                {
                  id: "event-c4",
                  type: "note",
                  notes: ["C4"],
                  startBeat: 0,
                  durationBeats: 1
                }
              ],
              source: {
                type: "manual-transcription",
                reviewStatus: "reviewed"
              }
            }
          }
        ]
      })
    ).toThrow(/approved provenance/);
  });

  it("accepts migration-blocked song lessons without exposing playable steps", () => {
    const course = courseSchema.parse({
      ...baseCourse,
      lessons: [
        {
          slug: "blocked-song",
          title: "Blocked Song",
          description: "Awaiting timing.",
          order: 1,
          isFinal: true,
          mode: "migration-blocked",
          contentKind: "complete-song",
          migrationStatus: "needs-transcription",
          unavailableReason: "Verified timing is required.",
          requiredTimingSource: "Reviewed source timing is required.",
          legacySteps: [
            {
              id: "play-c4",
              type: "single-note",
              instruction: "Play C4.",
              targetNotes: ["C4"]
            }
          ]
        }
      ]
    });

    expect(course.lessons[0]).toMatchObject({
      mode: "migration-blocked",
      legacySteps: expect.any(Array)
    });
    expect(course.lessons[0]).not.toHaveProperty("steps");
  });
});
