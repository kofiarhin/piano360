import { Router } from "express";

import { createLessonService, type LessonService } from "./lessonService";

export const createLessonRouter = (lessonService: LessonService = createLessonService()) => {
  const router = Router();

  router.get("/", async (_request, response, next) => {
    try {
      response.status(200).json(await lessonService.listLessons());
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      const lesson = await lessonService.getLesson(request.params.id);

      if (!lesson) {
        response.status(404).json({
          error: "lesson_not_found",
          message: `Lesson '${request.params.id}' was not found.`
        });
        return;
      }

      response.status(200).json(lesson);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
