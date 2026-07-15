import {
  normalizePlayableCourse,
  normalizePlayableCourses
} from "../src/courses/normalizePlayableCourse";
import { seedCourses } from "../src/courses/seedCourses";
import { courseSchema, noteIdSchema } from "../src/courses/courseValidation";
import type { Course, Lesson, TimelineEvent } from "../src/courses/courseTypes";

const noteMaterial = (lesson: Lesson) => {
  if (lesson.mode === "timeline") {
    return lesson.timeline.events.flatMap((event) => (event.type === "note" ? event.notes : []));
  }

  if (lesson.mode === "migration-blocked") {
    return (lesson.legacySteps ?? []).flatMap((step) => step.targetNotes);
  }

  return lesson.steps.flatMap((step) => step.targetNotes);
};

const lastEventEndBeat = (events: TimelineEvent[]) =>
  Math.max(...events.map((event) => event.startBeat + event.durationBeats));

const rawCourseBySlug = new Map(seedCourses.map((course) => [course.slug, course]));

const rawLessonFor = (course: Course, lessonSlug: string) => {
  const lesson = rawCourseBySlug.get(course.slug)?.lessons.find((item) => item.slug === lessonSlug);
  if (!lesson) {
    throw new Error(`Expected raw source lesson '${course.slug}/${lessonSlug}'.`);
  }
  return lesson;
};

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
      expect(course.lessons.some((lesson) => lesson.mode === "guided-steps")).toBe(false);
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

  it("preserves repeated foundational targets as separate timeline events", () => {
    const fingerPlacement = normalizedCourses.find((course) => course.slug === "finger-placement");
    const repeatedEvents = fingerPlacement?.lessons.flatMap((lesson) =>
      lesson.mode === "timeline"
        ? lesson.timeline.events.filter((event, index, events) => {
            const previous = events[index - 1];
            return (
              event.type === "note" &&
              previous?.type === "note" &&
              event.notes.length === 1 &&
              previous.notes.length === 1 &&
              event.notes[0] === previous.notes[0] &&
              event.id !== previous.id
            );
          })
        : []
    );

    expect(repeatedEvents?.length).toBeGreaterThan(0);
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
    expect(chordEvents?.some((event) => event.type === "note" && event.notes.length === 3)).toBe(
      true
    );
  });

  it("preserves existing note order when converting previously blocked songs", () => {
    const rawRedemption = seedCourses.find(
      (course) => course.slug === "redemption-song-limited-excerpt"
    );
    const rawFirstLesson = rawRedemption?.lessons[0];

    if (!rawFirstLesson || rawFirstLesson.mode !== "migration-blocked") {
      throw new Error("Expected Redemption Song seed lesson to retain migration source material.");
    }

    const expectedNotes = (rawFirstLesson.legacySteps ?? []).flatMap((step) => step.targetNotes);
    expect(timelineNotes("redemption-song-limited-excerpt", 0)).toEqual(expectedNotes);
  });

  it("preserves note material for every normalized lesson", () => {
    for (const course of normalizedCourses) {
      for (const lesson of course.lessons) {
        if (lesson.mode !== "timeline") {
          throw new Error("Expected normalized timeline lesson.");
        }

        expect(
          lesson.timeline.events.flatMap((event) => (event.type === "note" ? event.notes : []))
        ).toEqual(noteMaterial(rawLessonFor(course, lesson.slug)));
      }
    }
  });

  it("keeps every normalized timeline structurally valid and bounded", () => {
    for (const course of normalizedCourses) {
      for (const lesson of course.lessons) {
        if (lesson.mode !== "timeline") {
          throw new Error("Expected normalized timeline lesson.");
        }

        const eventIds = lesson.timeline.events.map((event) => event.id);
        expect(new Set(eventIds).size).toBe(eventIds.length);
        expect(lesson.timeline.totalBeats).toBeGreaterThanOrEqual(
          lastEventEndBeat(lesson.timeline.events)
        );
        expect(
          [...lesson.timeline.events].sort((first, second) => first.startBeat - second.startBeat)
        ).toEqual(lesson.timeline.events);

        for (const event of lesson.timeline.events) {
          expect(event.startBeat).toBeGreaterThanOrEqual(0);
          expect(event.durationBeats).toBeGreaterThan(0);
          if (event.type === "note") {
            for (const note of event.notes) {
              expect(noteIdSchema.parse(note)).toBe(note);
            }
          }
        }
      }
    }
  });

  it("marks converted song practice timing as instructional rather than verified", () => {
    const convertedLessons = normalizedCourses.flatMap((course) =>
      course.lessons.filter(
        (lesson) => rawLessonFor(course, lesson.slug).mode === "migration-blocked"
      )
    );

    expect(convertedLessons.length).toBeGreaterThan(0);
    for (const lesson of convertedLessons) {
      expect(lesson.mode).toBe("timeline");
      if (lesson.mode !== "timeline") continue;
      expect(lesson.timeline).toMatchObject({
        timingSource: "instructional",
        source: {
          type: "instructional-template",
          reference: "unified-song-practice-v1",
          reviewStatus: "instructional"
        }
      });
      expect(lesson.behaviour).toMatchObject({
        guidedInteractionMode: "stop-and-wait",
        enableTimingScore: true,
        timingProfile: "standard",
        allowPerformanceMode: true
      });
    }
  });

  it("defaults guided pause-on-miss timelines to stop-and-wait when the behavior is missing", () => {
    const [course] = normalizedCourses;
    const lesson = course?.lessons.find((item) => item.mode === "timeline");

    if (!course || !lesson || lesson.mode !== "timeline") {
      throw new Error("Expected a normalized timeline lesson.");
    }

    const legacyCourse = {
      ...course,
      lessons: [
        {
          ...lesson,
          order: 1,
          isFinal: true,
          behaviour: {
            defaultPracticeMode: "guided" as const,
            pauseOnMiss: true,
            enableTimingScore: true,
            timingProfile: "standard" as const,
            allowPerformanceMode: true
          }
        }
      ]
    };

    const normalized = normalizePlayableCourse(legacyCourse);
    const [normalizedLesson] = normalized.lessons;

    expect(normalizedLesson).toMatchObject({
      mode: "timeline",
      behaviour: {
        guidedInteractionMode: "stop-and-wait"
      }
    });
  });

  it("does not expand limited excerpt source material during normalization", () => {
    const limitedCourses = normalizedCourses.filter((course) =>
      course.title.includes("Limited Excerpt")
    );

    expect(limitedCourses.length).toBeGreaterThan(0);
    for (const course of limitedCourses) {
      for (const lesson of course.lessons) {
        if (lesson.mode !== "timeline") {
          throw new Error("Expected normalized timeline lesson.");
        }

        expect(
          lesson.timeline.events.flatMap((event) => (event.type === "note" ? event.notes : []))
        ).toEqual(noteMaterial(rawLessonFor(course, lesson.slug)));
      }
    }
  });

  it("normalizes deterministically", () => {
    expect(normalizePlayableCourses(seedCourses)).toEqual(normalizePlayableCourses(seedCourses));
    for (const course of seedCourses) {
      expect(normalizePlayableCourse(course)).toEqual(normalizePlayableCourse(course));
    }
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
    const finalAnswerEvent = answerLesson.timeline.events.at(-1);
    const finalCompleteEvent = completeLesson.timeline.events.at(-1);
    expect(finalAnswerEvent).toMatchObject({
      notes: finalCompleteEvent?.type === "note" ? finalCompleteEvent.notes : [],
      durationBeats: finalCompleteEvent?.durationBeats
    });
  });
});
