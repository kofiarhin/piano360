import { fetchLessons, type Lesson as ApiLesson } from "../../api";
import { isNoteId } from "../notes";
import type { Lesson } from "./lessonTypes";

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

export const getLessons = async (): Promise<Lesson[]> => {
  const lessons = await fetchLessons();

  return lessons.map(toLesson).sort((first, second) => first.order - second.order);
};
