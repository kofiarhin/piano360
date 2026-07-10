import { createCourseRepository, type CourseRepository } from "./courseRepository";
import type { Course, CourseFilters, CourseSummary, LessonDetail } from "./courseTypes";

const sortLessons = (course: Course): Course => ({
  ...course,
  lessons: [...course.lessons].sort((first, second) => first.order - second.order)
});

const summarizeCourse = (course: Course): CourseSummary => {
  const summary: Omit<Course, "lessons"> = {
    slug: course.slug,
    title: course.title,
    description: course.description,
    contentType: course.contentType,
    hand: course.hand,
    difficulty: course.difficulty,
    order: course.order
  };

  return {
    ...summary,
    lessonCount: course.lessons.length
  };
};

export const createCourseService = (repository: CourseRepository = createCourseRepository()) => ({
  async listCourses(filters?: CourseFilters): Promise<CourseSummary[]> {
    const courses = await repository.findAll(filters);
    return courses.map(sortLessons).map(summarizeCourse);
  },

  async getCourse(slug: string): Promise<Course | undefined> {
    const course = await repository.findBySlug(slug);
    return course ? sortLessons(course) : undefined;
  },

  async getLesson(courseSlug: string, lessonSlug: string): Promise<LessonDetail | undefined> {
    const course = await repository.findBySlug(courseSlug);
    const orderedCourse = course ? sortLessons(course) : undefined;
    const lesson = orderedCourse?.lessons.find((item) => item.slug === lessonSlug);

    if (!orderedCourse || !lesson) {
      return undefined;
    }

    return {
      ...lesson,
      courseSlug: orderedCourse.slug,
      courseTitle: orderedCourse.title,
      courseHand: orderedCourse.hand
    };
  }
});

export type CourseService = ReturnType<typeof createCourseService>;
