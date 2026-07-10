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

export const lessonSchema = z
  .object({
    slug: slugSchema,
    title: textSchema,
    description: textSchema,
    order: z.number().int().positive(),
    isFinal: z.boolean(),
    steps: z.array(lessonStepSchema).min(1)
  })
  .strict();

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

    if (course.lessons.filter((lesson) => lesson.isFinal).length !== 1) {
      context.addIssue({
        code: "custom",
        message: "Each course must have exactly one final lesson.",
        path: ["lessons"]
      });
    }

    const finalLesson = [...course.lessons].sort((first, second) => first.order - second.order).at(-1);
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
