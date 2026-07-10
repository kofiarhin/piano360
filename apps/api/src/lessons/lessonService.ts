import { InMemoryLessonRepository, type LessonRepository } from "./lessonRepository";

export const createLessonService = (
  repository: LessonRepository = new InMemoryLessonRepository()
) => ({
  listLessons: () => repository.findAll(),
  getLesson: (id: string) => repository.findById(id)
});

export type LessonService = ReturnType<typeof createLessonService>;
