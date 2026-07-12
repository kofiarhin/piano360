import { z } from "zod";

import { contentTypes, difficulties, hands, noteIds, stepTypes } from "./courseTypes";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const noteIdSchema = z.enum(noteIds);
export const contentTypeSchema = z.enum(contentTypes);
export const handSchema = z.enum(hands);
export const difficultySchema = z.enum(difficulties);

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
  isFinal: z.boolean()
};

const timelineEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      id: slugSchema,
      type: z.literal("note"),
      notes: z.array(noteIdSchema).min(1),
      startBeat: z.number().nonnegative(),
      durationBeats: z.number().positive(),
      hand: z.enum(["left", "right", "both"]).optional(),
      velocity: z.number().min(0).max(1).optional()
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
      durationBeats: z.number().positive()
    })
    .strict()
]);

export const songTimelineSchema = z
  .object({
    originalBpm: z.number().positive().max(400),
    timeSignature: z
      .object({
        numerator: z.number().int().positive().max(32),
        denominator: z.union([z.literal(2), z.literal(4), z.literal(8), z.literal(16)])
      })
      .strict(),
    countInBeats: z.number().int().nonnegative(),
    totalBeats: z.number().positive(),
    events: z.array(timelineEventSchema).min(1)
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
  });

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
    steps: z.never().optional(),
    timeline: songTimelineSchema
  })
  .strict();

export const lessonSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || "mode" in value) {
      return value;
    }

    return { ...(value as Record<string, unknown>), mode: "guided-steps" };
  },
  z.discriminatedUnion("mode", [guidedLessonSchema, timelineLessonSchema])
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
