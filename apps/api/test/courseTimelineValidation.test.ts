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
            ]
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
              ]
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
});
