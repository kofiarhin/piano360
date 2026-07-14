import { normalizePlayableCourses } from "../src/courses/normalizePlayableCourse";
import { seedCourses } from "../src/courses/seedCourses";
import { courseSchema } from "../src/courses/courseValidation";

const timelineNotes = (courseSlug: string, lessonIndex: number) => {
  const course = normalizePlayableCourses(seedCourses).find((item) => item.slug === courseSlug);
  const lesson = course?.lessons[lessonIndex];

  if (!lesson || lesson.mode !== "timeline") {
    throw new Error(`Expected ${courseSlug} lesson ${lessonIndex + 1} to be a timeline lesson.`);
  }

  return lesson.timeline.events.flatMap((event) => (event.type === "note" ? event.notes : []));
};

describe("unified playable course normalization", () => {
  const normalizedCourses = normalizePlayableCourses(seedCourses);

  it("makes every seeded lesson playable through the timeline player", () => {
    for (const course of normalizedCourses) {
      expect(() => courseSchema.parse(course)).not.toThrow();
      expect(course.lessons.length).toBeGreaterThan(0);
      expect(course.lessons.every((lesson) => lesson.mode === "timeline")).toBe(true);
    }
  });

  it("leaves no normalized seeded lesson migration-blocked", () => {
    const blockedLessons = normalizedCourses.flatMap((course) =>
      course.lessons.filter((lesson) => lesson.mode === "migration-blocked")
    );

    expect(blockedLessons).toEqual([]);
  });

  it("teaches varied note durations in foundational falling-note lessons", () => {
    const foundationCourses = normalizedCourses.filter((course) =>
      ["finger-placement", "beginner-chords"].includes(course.slug)
    );

    for (const course of foundationCourses) {
      for (const lesson of course.lessons) {
        expect(lesson.mode).toBe("timeline");
        if (lesson.mode !== "timeline") continue;

        const durations = new Set(lesson.timeline.events.map((event) => event.durationBeats));
        expect(durations.has(0.5)).toBe(true);
        expect(durations.has(1)).toBe(true);
        expect(durations.has(1.5)).toBe(true);
        expect(durations.has(2)).toBe(true);
      }
    }
  });

  it("preserves chord targets as simultaneous multi-note events", () => {
    const beginnerChords = normalizedCourses.find((course) => course.slug === "beginner-chords");
    expect(beginnerChords).toBeDefined();

    const chordEvents = beginnerChords?.lessons.flatMap((lesson) =>
      lesson.mode === "timeline"
        ? lesson.timeline.events.filter((event) => event.type === "note" && event.notes.length > 1)
        : []
    );

    expect(chordEvents?.length).toBeGreaterThan(0);
    expect(chordEvents?.some((event) => event.type === "note" && event.notes.length === 3)).toBe(true);
  });

  it("preserves existing note order when converting previously blocked songs", () => {
    const rawRedemption = seedCourses.find((course) => course.slug === "redemption-song-limited-excerpt");
    const rawFirstLesson = rawRedemption?.lessons[0];

    if (!rawFirstLesson || rawFirstLesson.mode !== "migration-blocked") {
      throw new Error("Expected Redemption Song seed lesson to retain migration source material.");
    }

    const expectedNotes = (rawFirstLesson.legacySteps ?? []).flatMap((step) => step.targetNotes);
    expect(timelineNotes("redemption-song-limited-excerpt", 0)).toEqual(expectedNotes);
  });

  it("repairs Ode to Joy phrase segmentation from the complete verified timeline", () => {
    const ode = normalizedCourses.find((course) => course.slug === "ode-to-joy");
    if (!ode) throw new Error("Expected Ode to Joy course.");

    const [firstLesson, answerLesson, completeLesson] = ode.lessons;
    if (
      firstLesson?.mode !== "timeline" ||
      answerLesson?.mode !== "timeline" ||
      completeLesson?.mode !== "timeline"
    ) {
      throw new Error("Expected all Ode to Joy lessons to be timeline lessons.");
    }

    const phraseNotes = [...firstLesson.timeline.events, ...answerLesson.timeline.events].flatMap(
      (event) => (event.type === "note" ? event.notes : [])
    );
    const completeNotes = completeLesson.timeline.events.flatMap((event) =>
      event.type === "note" ? event.notes : []
    );

    expect(phraseNotes).toEqual(completeNotes);
  });
});
