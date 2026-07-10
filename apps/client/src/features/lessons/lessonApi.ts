import { fetchLessons, type Lesson as ApiLesson } from "../../api";
import { isNoteId } from "../notes";
import type { Lesson } from "./lessonTypes";

const bundledLessons: ApiLesson[] = [
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

const toLesson = (lesson: ApiLesson): Lesson => {
  const notes = lesson.notes.map((note) => {
    if (!isNoteId(note)) {
      throw new Error(`Lesson ${lesson.id} returned invalid note '${note}'.`);
    }

    return note;
  });

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    notes,
    order: lesson.order
  };
};

const shouldUseBundledLessons = () => import.meta.env.PROD && !import.meta.env.VITE_API_URL;

export const getLessons = async (): Promise<Lesson[]> => {
  const lessons = shouldUseBundledLessons() ? bundledLessons : await fetchLessons();

  return lessons.map(toLesson).sort((first, second) => first.order - second.order);
};
