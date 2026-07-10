import { Router } from "express";

import { createCourseService, type CourseService } from "./courseService";
import { courseFiltersSchema } from "./courseValidation";

export const createCourseRouter = (courseService: CourseService = createCourseService()) => {
  const router = Router();

  router.get("/", async (request, response, next) => {
    try {
      const filters = courseFiltersSchema.parse(request.query);
      response.status(200).json(await courseService.listCourses(filters));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:courseSlug", async (request, response, next) => {
    try {
      const course = await courseService.getCourse(request.params.courseSlug);

      if (!course) {
        response.status(404).json({
          error: "course_not_found",
          message: `Course '${request.params.courseSlug}' was not found.`
        });
        return;
      }

      response.status(200).json(course);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:courseSlug/lessons/:lessonSlug", async (request, response, next) => {
    try {
      const lesson = await courseService.getLesson(request.params.courseSlug, request.params.lessonSlug);

      if (!lesson) {
        response.status(404).json({
          error: "lesson_not_found",
          message: `Lesson '${request.params.lessonSlug}' was not found in course '${request.params.courseSlug}'.`
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
