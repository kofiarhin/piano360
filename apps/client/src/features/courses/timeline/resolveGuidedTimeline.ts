import {
  isGuidedStepLesson,
  isMigrationBlockedLesson,
  isTimelineLesson,
  type LessonDetail,
  type NoteId,
  type TimeSignature,
  type TimedNoteEvent
} from "../courseTypes";

export const GENERATED_TIMELINE_DEFAULTS = {
  originalBpm: 60,
  countInBeats: 4,
  eventSpacingBeats: 2,
  durationBeats: 1,
  timeSignature: { numerator: 4, denominator: 4 } satisfies TimeSignature
} as const;

export type ResolvedGuidedTimeline = {
  lessonId: string;
  source: "authored" | "generated";
  timingSource: "instructional" | "verified";
  originalBpm: number;
  timeSignature: TimeSignature;
  countInBeats: number;
  totalBeats: number;
  events: TimedNoteEvent[];
};

export type ResolveGuidedTimelineResult =
  | { status: "playable"; timeline: ResolvedGuidedTimeline }
  | { status: "blocked"; reason: string }
  | { status: "invalid"; reason: string };

const duplicateNotes = (notes: NoteId[]) => {
  const seen = new Set<NoteId>();
  return notes.some((note) => {
    if (seen.has(note)) return true;
    seen.add(note);
    return false;
  });
};

const noteEventsFromTimeline = (lesson: LessonDetail): TimedNoteEvent[] =>
  lesson.timeline?.events.filter((event): event is TimedNoteEvent => event.type === "note") ?? [];

export const resolveGuidedTimeline = (lesson: LessonDetail): ResolveGuidedTimelineResult => {
  if (isMigrationBlockedLesson(lesson)) {
    return { status: "blocked", reason: lesson.unavailableReason };
  }

  if (isTimelineLesson(lesson)) {
    const events = noteEventsFromTimeline(lesson);
    if (events.length === 0) {
      return { status: "invalid", reason: "Lesson timeline does not contain playable notes." };
    }

    const duplicateEvent = events.find((event) => duplicateNotes(event.notes));
    if (duplicateEvent) {
      return {
        status: "invalid",
        reason: `Timeline event ${duplicateEvent.id} contains duplicate notes.`
      };
    }

    return {
      status: "playable",
      timeline: {
        lessonId: lesson.slug,
        source: "authored",
        timingSource: lesson.timeline.timingSource,
        originalBpm: lesson.timeline.originalBpm,
        timeSignature: lesson.timeline.timeSignature,
        countInBeats: lesson.timeline.countInBeats,
        totalBeats: lesson.timeline.totalBeats,
        events
      }
    };
  }

  if (!isGuidedStepLesson(lesson)) {
    return { status: "invalid", reason: "Lesson data is missing playable steps or timeline." };
  }

  if (lesson.steps.length === 0) {
    return { status: "invalid", reason: "Lesson has no guided steps to play." };
  }

  const duplicateStep = lesson.steps.find((step) => duplicateNotes(step.targetNotes));
  if (duplicateStep) {
    return {
      status: "invalid",
      reason: `Step ${duplicateStep.id} contains duplicate notes.`
    };
  }

  const events = lesson.steps.map((step, index): TimedNoteEvent => ({
    id: `generated-${step.id}`,
    type: "note",
    notes: [...step.targetNotes],
    startBeat: index * GENERATED_TIMELINE_DEFAULTS.eventSpacingBeats,
    durationBeats: GENERATED_TIMELINE_DEFAULTS.durationBeats,
    hand: lesson.courseHand,
    instruction: step.instruction
  }));
  const finalEvent = events[events.length - 1];

  return {
    status: "playable",
    timeline: {
      lessonId: lesson.slug,
      source: "generated",
      timingSource: "instructional",
      originalBpm: GENERATED_TIMELINE_DEFAULTS.originalBpm,
      timeSignature: GENERATED_TIMELINE_DEFAULTS.timeSignature,
      countInBeats: GENERATED_TIMELINE_DEFAULTS.countInBeats,
      totalBeats:
        finalEvent.startBeat + finalEvent.durationBeats + GENERATED_TIMELINE_DEFAULTS.durationBeats,
      events
    }
  };
};
