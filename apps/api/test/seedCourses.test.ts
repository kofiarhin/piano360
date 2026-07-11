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
});
