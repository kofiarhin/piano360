import { seedCourses } from "../src/courses/seedCourses";
import { courseSchema, noteIdSchema } from "../src/courses/courseValidation";
import type { Course, TimelineEvent } from "../src/courses/courseTypes";

const targetPlayableCourseSlugs = [
  "ode-to-joy",
  "three-little-birds-limited-excerpt",
  "rivers-of-babylon-limited-excerpt",
  "island-sunrise"
] as const;

const expectedSingleNoteMaterial = {
  "three-little-birds-limited-excerpt": [
    ["C4", "E4", "G4", "A4", "G4", "E4", "D4", "C4", "E4", "G4", "A4", "G4"],
    ["E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4", "D4", "E4"]
  ],
  "rivers-of-babylon-limited-excerpt": [
    ["E4", "G4", "A4", "B4", "A4", "G4", "E4", "D4", "E4", "G4", "A4", "G4"],
    ["G4", "E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4", "D4"]
  ],
  "island-sunrise": [
    ["C4", "E4", "G4", "E4", "C4", "D4", "E4", "G4", "A4", "G4", "E4", "D4"],
    ["E4", "G4", "A4", "B4", "A4", "G4", "E4", "D4", "C4", "D4", "E4", "G4"],
    ["A4", "G4", "E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4"]
  ]
} as const;

const expectedOdeToJoyNotes = [
  "E4",
  "E4",
  "F4",
  "G4",
  "G4",
  "F4",
  "E4",
  "D4",
  "C4",
  "C4",
  "D4",
  "E4",
  "E4",
  "D4",
  "D4",
  "E4",
  "E4",
  "F4",
  "G4",
  "G4",
  "F4",
  "E4",
  "D4",
  "C4",
  "C4",
  "D4",
  "E4",
  "D4",
  "C4"
] as const;

const getCourse = (slug: string): Course => {
  const course = seedCourses.find((item) => item.slug === slug);
  if (!course) {
    throw new Error(`Expected seeded course '${slug}'.`);
  }
  return course;
};

const noteEvents = (events: TimelineEvent[]) => events.filter((event) => event.type === "note");

const timelineNotes = (events: TimelineEvent[]) =>
  noteEvents(events).flatMap((event) => event.notes);

const lastEventEndBeat = (events: TimelineEvent[]) =>
  Math.max(...events.map((event) => event.startBeat + event.durationBeats));

describe("seed course validation", () => {
  const reggaeCourseSlugs = [
    "three-little-birds-limited-excerpt",
    "one-love-limited-excerpt",
    "redemption-song-limited-excerpt",
    "rivers-of-babylon-limited-excerpt",
    "island-sunrise",
    "one-drop-walk",
    "kingston-evening",
    "positive-vibration-study",
    "ska-step-up",
    "offbeat-run",
    "echo-bass-melody",
    "space-and-delay-study"
  ];
  const gospelCourseSlugs = [
    "amazing-grace",
    "great-is-thy-faithfulness",
    "blessed-assurance",
    "it-is-well-with-my-soul",
    "what-a-friend-we-have-in-jesus",
    "holy-holy-holy",
    "to-god-be-the-glory",
    "because-he-lives-limited-excerpt",
    "i-surrender-all",
    "there-is-power-in-the-blood",
    "pass-me-not-o-gentle-savior",
    "softly-and-tenderly",
    "just-as-i-am",
    "leaning-on-the-everlasting-arms",
    "victory-in-jesus-limited-excerpt",
    "trust-and-obey",
    "jesus-loves-me",
    "this-little-light-of-mine",
    "swing-low-sweet-chariot",
    "go-tell-it-on-the-mountain"
  ];

  it("keeps all seeded courses valid", () => {
    expect(() => seedCourses.map((course) => courseSchema.parse(course))).not.toThrow();
  });

  it("keeps every seeded note inside the inclusive A3-C5 keyboard", () => {
    for (const course of seedCourses) {
      for (const lesson of course.lessons) {
        const lessonNotes =
          lesson.mode === "timeline"
            ? lesson.timeline.events.flatMap((event) => (event.type === "note" ? event.notes : []))
            : lesson.mode === "migration-blocked"
              ? (lesson.legacySteps ?? []).flatMap((step) => step.targetNotes)
              : lesson.steps.flatMap((step) => step.targetNotes);
        for (const note of lessonNotes) {
          expect(noteIdSchema.parse(note)).toBe(note);
        }
      }
    }
  });

  it("uses final lessons for the complete course exercise", () => {
    for (const course of seedCourses) {
      const finalLesson = course.lessons.at(-1);

      expect(finalLesson?.isFinal).toBe(true);
      expect(finalLesson?.title.toLowerCase()).toContain("complete");
    }
  });

  it("keeps seeded lessons long enough for meaningful beginner practice", () => {
    for (const course of seedCourses) {
      for (const lesson of course.lessons) {
        const eventCount =
          lesson.mode === "timeline"
            ? lesson.timeline.events.length
            : lesson.mode === "migration-blocked"
              ? (lesson.legacySteps ?? []).length
              : lesson.steps.length;
        expect(eventCount).toBeGreaterThanOrEqual(12);
      }
    }
  });

  it("persists foundational courses as canonical instructional timeline lessons", () => {
    const foundationalCourses = seedCourses.filter((course) =>
      ["finger-placement", "beginner-chords"].includes(course.slug)
    );

    for (const course of foundationalCourses) {
      for (const lesson of course.lessons) {
        expect(lesson.mode).toBe("timeline");
        expect(lesson.contentKind).toBe("foundational-drill");
        if (lesson.mode === "timeline") {
          expect(lesson.timeline).toMatchObject({
            schemaVersion: 2,
            timingSource: "instructional",
            originalBpm: 60,
            countInBeats: 4,
            source: {
              type: "instructional-template",
              reviewStatus: "instructional"
            }
          });
          expect(lesson.behaviour).toMatchObject({
            defaultPracticeMode: "guided",
            pauseOnMiss: true,
            enableTimingScore: false,
            timingProfile: "generous",
            allowPerformanceMode: false
          });
        }
      }
    }
  });

  it("blocks seeded song and melody guided-step lessons instead of fabricating rhythm", () => {
    const blockedLessons = seedCourses
      .flatMap((course) => course.lessons.map((lesson) => ({ course, lesson })))
      .filter(({ lesson }) => lesson.mode === "migration-blocked");

    expect(blockedLessons.length).toBeGreaterThan(0);
    for (const { course, lesson } of blockedLessons) {
      expect(["finger-placement", "beginner-chords"]).not.toContain(course.slug);
      expect(lesson).toMatchObject({
        migrationStatus: "needs-transcription"
      });
      expect(lesson).not.toHaveProperty("steps");
      expect(lesson).not.toHaveProperty("timeline");
    }
  });

  it("publishes the prepared song courses as playable timeline lessons", () => {
    for (const courseSlug of targetPlayableCourseSlugs) {
      const course = getCourse(courseSlug);

      expect(course.lessons.every((lesson) => lesson.mode === "timeline")).toBe(true);
      expect(course.lessons.some((lesson) => lesson.mode === "migration-blocked")).toBe(false);
    }
  });

  it("keeps prepared song timelines valid, ordered, and fully bounded by totalBeats", () => {
    for (const courseSlug of targetPlayableCourseSlugs) {
      const course = getCourse(courseSlug);

      expect(() => courseSchema.parse(course)).not.toThrow();
      for (const lesson of course.lessons) {
        expect(lesson.mode).toBe("timeline");
        if (lesson.mode !== "timeline") continue;

        expect(lesson.timeline).toMatchObject({
          schemaVersion: 2,
          timingSource: "verified",
          source: {
            type: "manual-transcription",
            reviewStatus: "approved"
          }
        });
        expect(lesson.timeline.totalBeats).toBeGreaterThanOrEqual(
          lastEventEndBeat(lesson.timeline.events)
        );

        const eventIds = lesson.timeline.events.map((event) => event.id);
        expect(new Set(eventIds).size).toBe(eventIds.length);
        expect(
          [...lesson.timeline.events].sort((first, second) => first.startBeat - second.startBeat)
        ).toEqual(lesson.timeline.events);
      }
    }
  });

  it("derives every Ode to Joy lesson from the complete verified timeline", () => {
    const course = getCourse("ode-to-joy");
    const [firstLesson, answerLesson, completeLesson] = course.lessons;

    expect(firstLesson?.mode).toBe("timeline");
    expect(answerLesson?.mode).toBe("timeline");
    expect(completeLesson?.mode).toBe("timeline");
    if (
      firstLesson?.mode !== "timeline" ||
      answerLesson?.mode !== "timeline" ||
      completeLesson?.mode !== "timeline"
    ) {
      throw new Error("Expected Ode to Joy to be fully playable timelines.");
    }

    const completeEvents = noteEvents(completeLesson.timeline.events);
    const firstEvents = noteEvents(firstLesson.timeline.events);
    const answerEvents = noteEvents(answerLesson.timeline.events);

    expect(timelineNotes(completeLesson.timeline.events)).toEqual(expectedOdeToJoyNotes);
    expect([
      ...timelineNotes(firstLesson.timeline.events),
      ...timelineNotes(answerLesson.timeline.events)
    ]).toEqual(expectedOdeToJoyNotes);

    const firstSourceSlice = completeEvents.slice(0, firstEvents.length);
    const answerSourceSlice = completeEvents.slice(firstEvents.length);
    const answerOffset = answerSourceSlice[0]?.startBeat ?? 0;

    expect(
      firstEvents.map(({ notes, startBeat, durationBeats }) => ({
        notes,
        startBeat,
        durationBeats
      }))
    ).toEqual(
      firstSourceSlice.map(({ notes, startBeat, durationBeats }) => ({
        notes,
        startBeat,
        durationBeats
      }))
    );
    expect(
      answerEvents.map(({ notes, startBeat, durationBeats }) => ({
        notes,
        startBeat,
        durationBeats
      }))
    ).toEqual(
      answerSourceSlice.map(({ notes, startBeat, durationBeats }) => ({
        notes,
        startBeat: startBeat - answerOffset,
        durationBeats
      }))
    );
  });

  it("preserves approved limited excerpt and Island Sunrise note boundaries", () => {
    for (const [courseSlug, phraseNotes] of Object.entries(expectedSingleNoteMaterial)) {
      const course = getCourse(courseSlug);
      const phraseLessons = course.lessons.slice(0, phraseNotes.length);
      const finalLesson = course.lessons.at(-1);

      for (const [index, lesson] of phraseLessons.entries()) {
        expect(lesson.mode).toBe("timeline");
        if (lesson.mode === "timeline") {
          expect(timelineNotes(lesson.timeline.events)).toEqual(phraseNotes[index]);
        }
      }

      expect(finalLesson?.mode).toBe("timeline");
      if (finalLesson?.mode === "timeline") {
        expect(timelineNotes(finalLesson.timeline.events)).toEqual(phraseNotes.flat());
      }
    }
  });

  it("defines the approved twelve-course reggae collection in progression order", () => {
    const reggaeCourses = seedCourses.filter((course) => reggaeCourseSlugs.includes(course.slug));

    expect(reggaeCourses.map((course) => course.slug)).toEqual(reggaeCourseSlugs);
    expect(reggaeCourses).toHaveLength(12);
    expect(reggaeCourses.map((course) => course.order)).toEqual([
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    ]);
  });

  it("keeps reggae courses beginner right-hand single-note material", () => {
    for (const course of seedCourses.filter((course) => reggaeCourseSlugs.includes(course.slug))) {
      expect(course).toMatchObject({
        contentType: "single-note",
        hand: "right",
        difficulty: "beginner"
      });
      expect(course.lessons.at(-1)?.title.toLowerCase()).toContain("complete");
    }
  });

  it("marks recognizable reggae songs as limited approved excerpts", () => {
    const recognizableCourseSlugs = reggaeCourseSlugs.slice(0, 4);

    for (const course of seedCourses.filter((course) =>
      recognizableCourseSlugs.includes(course.slug)
    )) {
      expect(course.title).toContain("Limited Excerpt");
      expect(course.description.toLowerCase()).toContain("approved excerpt");
    }
  });

  it("keeps reggae lesson slugs and step ids unique across the collection", () => {
    const lessonSlugs = new Set<string>();
    const stepIds = new Set<string>();

    for (const course of seedCourses.filter((course) => reggaeCourseSlugs.includes(course.slug))) {
      for (const lesson of course.lessons) {
        expect(lessonSlugs.has(lesson.slug)).toBe(false);
        lessonSlugs.add(lesson.slug);

        const steps =
          lesson.mode === "migration-blocked"
            ? (lesson.legacySteps ?? [])
            : "steps" in lesson
              ? lesson.steps
              : [];

        for (const step of steps) {
          expect(stepIds.has(step.id)).toBe(false);
          stepIds.add(step.id);
        }
      }
    }
  });

  it("appends the twenty-course gospel melody collection in progression order", () => {
    const gospelCourses = seedCourses.filter((course) => gospelCourseSlugs.includes(course.slug));

    expect(gospelCourses.map((course) => course.slug)).toEqual(gospelCourseSlugs);
    expect(gospelCourses).toHaveLength(20);
    expect(gospelCourses.map((course) => course.order)).toEqual([
      16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
    ]);
  });

  it("keeps gospel courses as beginner right-hand single-note melodies with three phrases", () => {
    for (const course of seedCourses.filter((course) => gospelCourseSlugs.includes(course.slug))) {
      expect(course).toMatchObject({
        contentType: "single-note",
        hand: "right",
        difficulty: "beginner"
      });
      expect(course.lessons).toHaveLength(4);
      expect(course.lessons.slice(0, 3).every((lesson) => !lesson.isFinal)).toBe(true);
      expect(course.lessons.at(-1)).toMatchObject({
        isFinal: true,
        title: expect.stringContaining("Complete")
      });
    }
  });

  it("combines all gospel phrases in each complete song lesson", () => {
    for (const course of seedCourses.filter((course) => gospelCourseSlugs.includes(course.slug))) {
      const phraseNotes = course.lessons
        .slice(0, 3)
        .flatMap((lesson) =>
          (lesson.mode === "migration-blocked" ? (lesson.legacySteps ?? []) : []).map(
            (step) => step.targetNotes[0]
          )
        );
      const finalLesson = course.lessons.at(-1);
      const completeNotes =
        finalLesson?.mode === "migration-blocked"
          ? finalLesson.legacySteps?.map((step) => step.targetNotes[0])
          : [];

      expect(completeNotes).toEqual(phraseNotes);
    }
  });

  it("marks uncertain gospel songs as limited approved excerpts", () => {
    const limitedGospelSlugs = [
      "because-he-lives-limited-excerpt",
      "victory-in-jesus-limited-excerpt"
    ];

    for (const course of seedCourses.filter((course) => limitedGospelSlugs.includes(course.slug))) {
      expect(course.title).toContain("Limited Excerpt");
      expect(course.description.toLowerCase()).toContain("approved excerpt");
    }
  });
});
