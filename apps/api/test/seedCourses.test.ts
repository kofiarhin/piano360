import { seedCourses } from "../src/courses/seedCourses";
import { courseSchema, noteIdSchema } from "../src/courses/courseValidation";

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
        for (const step of lesson.steps) {
          for (const note of step.targetNotes) {
            expect(noteIdSchema.parse(note)).toBe(note);
          }
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
        expect(lesson.steps.length).toBeGreaterThanOrEqual(12);
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

        for (const step of lesson.steps) {
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
        .flatMap((lesson) => lesson.steps.map((step) => step.targetNotes[0]));
      const completeNotes = course.lessons.at(-1)?.steps.map((step) => step.targetNotes[0]);

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
