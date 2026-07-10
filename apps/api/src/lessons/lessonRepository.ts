import { isNoteId } from "../notes";
import type { Lesson } from "./lessonTypes";

type SeedLesson = {
  id: string;
  title: string;
  description?: string;
  notes: unknown[];
  order: number;
};

const seededLessons: SeedLesson[] = [
  {
    id: "lesson-1",
    title: "Lesson 1",
    description: "Find the first three white keys around middle C.",
    notes: ["C4", "D4", "E4"],
    order: 1
  },
  {
    id: "lesson-2",
    title: "Lesson 2",
    description: "Continue upward from F4 to C5.",
    notes: ["F4", "G4", "A4", "B4", "C5"],
    order: 2
  },
  {
    id: "lesson-3",
    title: "Lesson 3",
    description: "Practice a mixed pattern across the C major hand position.",
    notes: ["C4", "E4", "G4", "D4", "F4", "A4"],
    order: 3
  }
];

export type LessonRepository = {
  findAll(): Promise<Lesson[]>;
  findById(id: string): Promise<Lesson | undefined>;
};

const assertText = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid lesson ${field}`);
  }

  return value;
};

const validateLesson = (lesson: SeedLesson): Lesson => {
  const notes = lesson.notes.map((note) => {
    if (!isNoteId(note)) {
      throw new Error(`Invalid lesson note: ${String(note)}`);
    }

    return note;
  });

  if (!Number.isInteger(lesson.order) || lesson.order < 1) {
    throw new Error(`Invalid lesson order: ${lesson.id}`);
  }

  return {
    id: assertText(lesson.id, "id"),
    title: assertText(lesson.title, "title"),
    description:
      typeof lesson.description === "string" && lesson.description.trim().length > 0
        ? lesson.description
        : undefined,
    notes,
    order: lesson.order
  };
};

export class InMemoryLessonRepository implements LessonRepository {
  private readonly lessons = seededLessons.map(validateLesson).sort((first, second) => first.order - second.order);

  async findAll() {
    return this.lessons;
  }

  async findById(id: string) {
    return this.lessons.find((lesson) => lesson.id === id);
  }
}
