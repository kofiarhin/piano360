import type {
  GuidedStepLesson,
  InstructionalTimingTemplate,
  LessonBehaviour,
  LessonContentKind,
  TimelineLesson
} from "./courseTypes";

export type InstructionalTimelineProfile = {
  template: InstructionalTimingTemplate;
  timeSignature: {
    numerator: number;
    denominator: 4;
  };
  behaviour: LessonBehaviour;
};

export const foundationalInstructionalProfile: InstructionalTimelineProfile = {
  template: {
    templateId: "foundational-quarter-note-v1",
    eventSpacingBeats: 2,
    noteDurationBeats: 1,
    firstEventBeat: 0,
    originalBpm: 60,
    countInBeats: 4,
    timingWindows: {
      perfectMs: 180,
      goodMs: 350,
      acceptedMs: 700
    }
  },
  timeSignature: { numerator: 4, denominator: 4 },
  behaviour: {
    defaultPracticeMode: "guided",
    pauseOnMiss: true,
    enableTimingScore: false,
    timingProfile: "generous",
    allowPerformanceMode: false
  }
};

export const legacyStepsToInstructionalTimeline = (
  lesson: GuidedStepLesson,
  profile: InstructionalTimelineProfile = foundationalInstructionalProfile,
  contentKind: LessonContentKind = "foundational-drill"
): TimelineLesson => {
  const { template } = profile;
  const events = lesson.steps.map((step, index) => ({
    id: step.id,
    type: "note" as const,
    notes: [...step.targetNotes],
    startBeat: template.firstEventBeat + index * template.eventSpacingBeats,
    durationBeats: template.noteDurationBeats,
    hand: "right" as const,
    instruction: step.instruction
  }));
  const totalBeats =
    events.length === 0
      ? template.firstEventBeat
      : events[events.length - 1].startBeat + template.eventSpacingBeats;

  return {
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    isFinal: lesson.isFinal,
    mode: "timeline",
    contentKind,
    defaultPracticeMode: profile.behaviour.defaultPracticeMode,
    availablePracticeModes: profile.behaviour.allowPerformanceMode
      ? ["guided", "performance"]
      : ["guided"],
    behaviour: { ...profile.behaviour },
    timeline: {
      schemaVersion: 2,
      timingSource: "instructional",
      originalBpm: template.originalBpm,
      timeSignature: profile.timeSignature,
      countInBeats: template.countInBeats,
      totalBeats,
      events,
      source: {
        type: "instructional-template",
        reference: template.templateId,
        reviewStatus: "instructional"
      },
      instructionalTemplate: {
        ...template,
        timingWindows: { ...template.timingWindows }
      }
    }
  };
};
