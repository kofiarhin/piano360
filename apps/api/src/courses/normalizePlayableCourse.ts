import type {
  Course,
  GuidedStepLesson,
  InstructionalTimingTemplate,
  Lesson,
  LessonBehaviour,
  LessonContentKind,
  TimelineEvent,
  TimelineLesson
} from "./courseTypes";
import { courseSchema } from "./courseValidation";
import {
  legacyStepsToInstructionalTimeline,
  type InstructionalTimelineProfile
} from "./legacyStepsToInstructionalTimeline";

const foundationalCourseSlugs = new Set(["finger-placement", "beginner-chords"]);

const foundationalDurations = [0.5, 1, 1.5, 2] as const;
const songDurations = [0.5, 0.75, 1, 1.5] as const;

const songTemplate: InstructionalTimingTemplate = {
  templateId: "unified-song-practice-v1",
  eventSpacingBeats: 1,
  noteDurationBeats: 0.75,
  firstEventBeat: 0,
  originalBpm: 80,
  countInBeats: 4,
  timingWindows: {
    perfectMs: 140,
    goodMs: 280,
    acceptedMs: 520
  }
};

const songBehaviour: LessonBehaviour = {
  defaultPracticeMode: "guided",
  pauseOnMiss: true,
  enableTimingScore: true,
  timingProfile: "standard",
  allowPerformanceMode: true
};

const songInstructionalProfile: InstructionalTimelineProfile = {
  template: songTemplate,
  timeSignature: { numerator: 4, denominator: 4 },
  behaviour: songBehaviour
};

const contentKindFor = (lesson: Lesson): LessonContentKind =>
  lesson.isFinal ? "complete-song" : "song-phrase";

const retimeEvents = (
  events: TimelineEvent[],
  durations: readonly number[],
  gapBeats: number
): TimelineEvent[] => {
  let cursor = 0;

  return events.map((event, index) => {
    const durationBeats = durations[index % durations.length];
    const retimed = {
      ...event,
      startBeat: cursor,
      durationBeats
    };

    cursor += durationBeats + gapBeats;
    return retimed;
  });
};

const endBeatOf = (events: TimelineEvent[]) =>
  events.length === 0
    ? 0
    : Math.max(...events.map((event) => event.startBeat + event.durationBeats));

const withRetimedEvents = (
  lesson: TimelineLesson,
  durations: readonly number[],
  gapBeats: number
): TimelineLesson => {
  const events = retimeEvents(lesson.timeline.events, durations, gapBeats);

  return {
    ...lesson,
    timeline: {
      ...lesson.timeline,
      totalBeats: endBeatOf(events),
      events
    }
  };
};

const blockedLessonToTimeline = (lesson: Extract<Lesson, { mode: "migration-blocked" }>) => {
  if (!lesson.legacySteps || lesson.legacySteps.length === 0) {
    throw new Error(
      `Cannot normalize blocked lesson '${lesson.slug}' because it has no retained legacy steps.`
    );
  }

  const guidedLesson: GuidedStepLesson = {
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    isFinal: lesson.isFinal,
    mode: "guided-steps",
    steps: lesson.legacySteps.map((step) => ({
      ...step,
      targetNotes: [...step.targetNotes]
    }))
  };

  const timelineLesson = legacyStepsToInstructionalTimeline(
    guidedLesson,
    songInstructionalProfile,
    contentKindFor(lesson)
  );

  return withRetimedEvents(timelineLesson, songDurations, 0.25);
};

const normalizeOdeToJoy = (course: Course): Course => {
  if (course.slug !== "ode-to-joy" || course.lessons.length < 3) {
    return course;
  }

  const [firstLesson, answerLesson, completeLesson] = course.lessons;
  if (
    firstLesson?.mode !== "timeline" ||
    answerLesson?.mode !== "timeline" ||
    completeLesson?.mode !== "timeline"
  ) {
    return course;
  }

  const completeEvents = completeLesson.timeline.events;
  const firstEventCount = firstLesson.timeline.events.length;
  const expectedAnswerEvents = completeEvents.slice(firstEventCount);

  if (answerLesson.timeline.events.length === expectedAnswerEvents.length) {
    return course;
  }

  const answerStartBeat = expectedAnswerEvents[0]?.startBeat ?? 0;
  const repairedAnswerEvents = expectedAnswerEvents.map((event, index) => ({
    ...event,
    id: `ode-answer-phrase-${String(index + 1).padStart(2, "0")}`,
    startBeat: event.startBeat - answerStartBeat
  }));

  const repairedAnswerLesson: TimelineLesson = {
    ...answerLesson,
    timeline: {
      ...answerLesson.timeline,
      totalBeats: endBeatOf(repairedAnswerEvents),
      events: repairedAnswerEvents,
      source: {
        ...completeLesson.timeline.source,
        reference: `${completeLesson.timeline.source.reference ?? "Verified Ode to Joy timeline"} Derived answer phrase from the complete verified timeline.`
      }
    }
  };

  return {
    ...course,
    lessons: [firstLesson, repairedAnswerLesson, completeLesson]
  };
};

const normalizeLesson = (courseSlug: string, lesson: Lesson): TimelineLesson => {
  if (lesson.mode === "migration-blocked") {
    return blockedLessonToTimeline(lesson);
  }

  if (lesson.mode !== "timeline") {
    const contentKind = foundationalCourseSlugs.has(courseSlug)
      ? "foundational-drill"
      : contentKindFor(lesson);
    const converted = legacyStepsToInstructionalTimeline(
      lesson,
      foundationalCourseSlugs.has(courseSlug) ? undefined : songInstructionalProfile,
      contentKind
    );

    return foundationalCourseSlugs.has(courseSlug)
      ? withRetimedEvents(converted, foundationalDurations, 0.5)
      : withRetimedEvents(converted, songDurations, 0.25);
  }

  if (
    foundationalCourseSlugs.has(courseSlug) &&
    lesson.timeline.timingSource === "instructional"
  ) {
    return withRetimedEvents(lesson, foundationalDurations, 0.5);
  }

  return lesson;
};

export const normalizePlayableCourse = (course: Course): Course => {
  const normalized = {
    ...course,
    lessons: course.lessons.map((lesson) => normalizeLesson(course.slug, lesson))
  };

  return courseSchema.parse(normalizeOdeToJoy(normalized));
};

export const normalizePlayableCourses = (courses: Course[]): Course[] =>
  courses.map((course) => normalizePlayableCourse(course));
