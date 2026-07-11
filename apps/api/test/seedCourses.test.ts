import { seedCourses } from "../src/courses/seedCourses";
import { courseSchema, noteIdSchema } from "../src/courses/courseValidation";

describe("seed course validation", () => {
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
});
