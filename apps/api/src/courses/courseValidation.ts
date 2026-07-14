import { z } from "zod";

import {
  contentTypes,
  difficulties,
  hands,
  lessonContentKinds,
  noteIds,
  stepTypes,
  timelinePracticeModes,
  timelineReviewStatuses,
  timelineSourceTypes,
  timelineTimingSources,
  timingProfiles
} from "./courseTypes";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const noteIdSchema = z.enum(noteIds);
export const contentTypeSchema = z.enum(contentTypes);
export const handSchema = z.enum(hands);
export const difficultySchema = z.enum(difficulties);
export const lessonContentKindSchema = z.enum(lessonContentKinds);

const textSchema = z.string().trim().min(1);
const slugSchema = z.string().trim().regex(slugPattern);

export const lessonStepSchema = z
  .object({
    id: slugSchema,
    type: z.enum(stepTypes),
    instruction: textSchema,
    targetNotes: z.array(noteIdSchema)
  })
  .superRefine((step, context) => {
    if (step.type === "single-note" && step.targetNotes.length !== 1) {
      context.addIssue({
        code: "custom",
        message: "Single-note steps must have exactly one target note.",
        path: ["targetNotes"]
      });
    }

    if (step.type === "chord" && step.targetNotes.length < 2) {
      context.addIssue({
        code: "custom",
        message: "Chord steps must have at least two target notes.",
        path: ["targetNotes"]
      });
    }

    if (new Set(step.targetNotes).size !== step.targetNotes.length) {
      context.addIssue({
        code: "custom",
        message: "Step target notes must be unique.",
        path: ["targetNotes"]
      });
    }
  });

const lessonBaseShape = {
  slug: slugSchema,
  title: textSchema,
  description: textSchema,
  order: z.number().int().positive(),
  isFinal: z.boolean(),
  contentKind: lessonContentKindSchema.optional()
};

const timingWindowsSchema = z
  .object({
    perfectMs: z.number().positive(),
    goodMs: z.number().positive(),
    acceptedMs: z.number().positive()
  })
  .strict()
  .superRefine((windows, context) => {
    if (!(windows.perfectMs <= windows.goodMs && windows.goodMs <= windows.acceptedMs)) {
      context.addIssue({
        code: "custom",
        message: "Timing windows must be ordered perfect <= good <= accepted.",
        path: ["acceptedMs"]
      });
    }
  });

const instructionalTimingTemplateSchema = z
  .object({
    templateId: slugSchema,
    eventSpacingBeats: z.number().positive(),
    noteDurationBeats: z.number().positive(),
    firstEventBeat: z.number().nonnegative(),
    restBetweenGroupsBeats: z.number().nonnegative().optional(),
    originalBpm: z.number().positive().max(400),
    countInBeats: z.number().int().nonnegative(),
    timingWindows: timingWindowsSchema
  })
  .strict();

const timelineSourceMetadataSchema = z
  .object({
    type: z.enum(timelineSourceTypes),
    reference: z.string().trim().min(1).optional(),
    importedAt: z.string().trim().min(1).optional(),
    importedBy: z.string().trim().min(1).optional(),
    reviewedAt: z.string().trim().min(1).optional(),
    reviewedBy: z.string().trim().min(1).optional(),
    reviewStatus: z.enum(timelineReviewStatuses)
  })
  .strict();

const timelineEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      id: slugSchema,
      type: z.literal("note"),
      notes: z.array(noteIdSchema).min(1),
      startBeat: z.number().nonnegative(),
      durationBeats: z.number().positive(),
      hand: z.enum(["left", "right", "both"]).optional(),
      velocity: z.number().min(0).max(1).optional(),
      instruction: textSchema.optional(),
      fingerNumbers: z.array(z.number().int().positive().max(5)).optional()
    })
    .strict()
    .superRefine((event, context) => {
      if (new Set(event.notes).size !== event.notes.length) {
        context.addIssue({
          code: "custom",
          message: "Timed note pitches must be unique.",
          path: ["notes"]
        });
      }
    }),
  z
    .object({
      id: slugSchema,
      type: z.literal("rest"),
      startBeat: z.number().nonnegative(),
      durationBeats: z.number().positive(),
      instruction: textSchema.optional()
    })
    .strict()
]);

export const songTimelineSchema = z
  .object({
    schemaVersion: z.literal(2),
    timingSource: z.enum(timelineTimingSources),
    originalBpm: z.number().positive().max(400),
    timeSignature: z
      .object({
        numerator: z.number().int().positive().max(32),
        denominator: z.union([z.literal(2), z.literal(4), z.literal(8), z.literal(16)])
      })
      .strict(),
    countInBeats: z.number().int().nonnegative(),
    totalBeats: z.number().positive(),
    pickupBeats: z.number().nonnegative().optional(),
    events: z.array(timelineEventSchema).min(1).max(2000),
    source: timelineSourceMetadataSchema,
    instructionalTemplate: instructionalTimingTemplateSchema.optional()
  })
  .strict()
  .superRefine((timeline, context) => {
    const eventIds = new Set<string>();
    let previousStartBeat = -1;

    timeline.events.forEach((event, index) => {
      if (eventIds.has(event.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate timeline event id '${event.id}'.`,
          path: ["events", index, "id"]
        });
      }
      eventIds.add(event.id);

      if (event.startBeat < previousStartBeat) {
        context.addIssue({
          code: "custom",
          message: "Timeline events must be ordered by startBeat.",
          path: ["events", index, "startBeat"]
        });
      }
      previousStartBeat = event.startBeat;

      if (event.startBeat + event.durationBeats > timeline.totalBeats) {
        context.addIssue({
          code: "custom",
          message: "Timeline event must end on or before totalBeats.",
          path: ["events", index, "durationBeats"]
        });
      }
    });

    if (timeline.timingSource === "instructional") {
      if (timeline.source.type !== "instructional-template") {
        context.addIssue({
          code: "custom",
          message: "Instructional timelines must use instructional-template source metadata.",
          path: ["source", "type"]
        });
      }
      if (timeline.source.reviewStatus !== "instructional") {
        context.addIssue({
          code: "custom",
          message: "Instructional timelines must use instructional review status.",
          path: ["source", "reviewStatus"]
        });
      }
      if (!timeline.instructionalTemplate) {
        context.addIssue({
          code: "custom",
          message: "Instructional timelines require an instructionalTemplate.",
          path: ["instructionalTemplate"]
        });
      }
    }

    if (timeline.timingSource === "verified") {
      if (timeline.source.type === "instructional-template") {
        context.addIssue({
          code: "custom",
          message: "Verified timelines must not use instructional-template source metadata.",
          path: ["source", "type"]
        });
      }
      if (timeline.instructionalTemplate) {
        context.addIssue({
          code: "custom",
          message: "Verified timelines must not include instructionalTemplate.",
          path: ["instructionalTemplate"]
        });
      }
    }
  });

const lessonBehaviourSchema = z
  .object({
    defaultPracticeMode: z.enum(timelinePracticeModes),
    pauseOnMiss: z.boolean(),
    enableTimingScore: z.boolean(),
    timingProfile: z.enum(timingProfiles),
    allowPerformanceMode: z.boolean()
  })
  .strict();

const guidedLessonSchema = z
  .object({
    ...lessonBaseShape,
    mode: z.literal("guided-steps"),
    steps: z.array(lessonStepSchema).min(1),
    timeline: z.never().optional()
  })
  .strict();

const timelineLessonSchema = z
  .object({
    ...lessonBaseShape,
    mode: z.literal("timeline"),
    contentKind: lessonContentKindSchema,
    defaultPracticeMode: z.enum(timelinePracticeModes),
    availablePracticeModes: z.array(z.enum(timelinePracticeModes)).min(1),
    behaviour: lessonBehaviourSchema,
    steps: z.never().optional(),
    legacySteps: z.never().optional(),
    timeline: songTimelineSchema
  })
  .strict()
  .superRefine((lesson, context) => {
    if (!lesson.availablePracticeModes.includes(lesson.defaultPracticeMode)) {
      context.addIssue({
        code: "custom",
        message: "defaultPracticeMode must be included in availablePracticeModes.",
        path: ["defaultPracticeMode"]
      });
    }

    if (lesson.behaviour.defaultPracticeMode !== lesson.defaultPracticeMode) {
      context.addIssue({
        code: "custom",
        message: "behaviour.defaultPracticeMode must match lesson defaultPracticeMode.",
        path: ["behaviour", "defaultPracticeMode"]
      });
    }

    if (
      !lesson.behaviour.allowPerformanceMode &&
      lesson.availablePracticeModes.includes("performance")
    ) {
      context.addIssue({
        code: "custom",
        message: "availablePracticeModes cannot include performance when behaviour disallows it.",
        path: ["availablePracticeModes"]
      });
    }

    const isSong = lesson.contentKind === "song-phrase" || lesson.contentKind === "complete-song";
    if (
      isSong &&
      lesson.timeline.timingSource === "verified" &&
      lesson.timeline.source.reviewStatus !== "approved"
    ) {
      context.addIssue({
        code: "custom",
        message: "Verified song phrase and complete song lessons require approved provenance.",
        path: ["timeline", "source", "reviewStatus"]
      });
    }
  });

const migrationBlockedLessonSchema = z
  .object({
    ...lessonBaseShape,
    mode: z.literal("migration-blocked"),
    contentKind: z.union([z.literal("song-phrase"), z.literal("complete-song")]),
    migrationStatus: z.union([z.literal("needs-transcription"), z.literal("needs-review")]),
    unavailableReason: textSchema,
    requiredTimingSource: textSchema,
    legacySteps: z.array(lessonStepSchema).min(1).optional(),
    steps: z.never().optional(),
    timeline: z.never().optional()
  })
  .strict();

export const lessonSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || "mode" in value) {
      return value;
    }

    return { ...(value as Record<string, unknown>), mode: "guided-steps" };
  },
  z.discriminatedUnion("mode", [
    guidedLessonSchema,
    timelineLessonSchema,
    migrationBlockedLessonSchema
  ])
);

export const courseSchema = z
  .object({
    slug: slugSchema,
    title: textSchema,
    description: textSchema,
    contentType: contentTypeSchema,
    hand: handSchema,
    difficulty: difficultySchema,
    order: z.number().int().positive(),
    lessons: z.array(lessonSchema).min(1)
  })
  .strict()
  .superRefine((course, context) => {
    const lessonSlugs = new Set<string>();
    const lessonOrders = new Set<number>();

    for (const lesson of course.lessons) {
      if (lessonSlugs.has(lesson.slug)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate lesson slug '${lesson.slug}'.`,
          path: ["lessons"]
        });
      }
      lessonSlugs.add(lesson.slug);

      if (lessonOrders.has(lesson.order)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate lesson order '${lesson.order}'.`,
          path: ["lessons"]
        });
      }
      lessonOrders.add(lesson.order);

      if (lesson.mode === "guided-steps") {
        const stepIds = new Set<string>();
        for (const step of lesson.steps) {
          if (stepIds.has(step.id)) {
            context.addIssue({
              code: "custom",
              message: `Duplicate step id '${step.id}' in lesson '${lesson.slug}'.`,
              path: ["lessons"]
            });
          }
          stepIds.add(step.id);
        }
      }
    }

    if (course.lessons.filter((lesson) => lesson.isFinal).length !== 1) {
      context.addIssue({
        code: "custom",
        message: "Each course must have exactly one final lesson.",
        path: ["lessons"]
      });
    }

    const finalLesson = [...course.lessons]
      .sort((first, second) => first.order - second.order)
      .at(-1);
    if (!finalLesson?.isFinal) {
      context.addIssue({
        code: "custom",
        message: "The ordered final lesson must be marked as final.",
        path: ["lessons"]
      });
    }
  });

export const courseFiltersSchema = z
  .object({
    contentType: contentTypeSchema.optional(),
    hand: handSchema.optional(),
    difficulty: difficultySchema.optional()
  })
  .strict();
