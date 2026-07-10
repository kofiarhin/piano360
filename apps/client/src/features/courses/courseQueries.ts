import { fetchCourse, fetchCourses, fetchLesson } from "../../api";
import type { CourseFilters } from "./courseTypes";

export const courseQueryKeys = {
  courses: (filters: CourseFilters) => ["courses", filters] as const,
  course: (courseSlug: string) => ["course", courseSlug] as const,
  lesson: (courseSlug: string, lessonSlug: string) => ["lesson", courseSlug, lessonSlug] as const
};

export const getCourses = (filters: CourseFilters) => fetchCourses(filters);
export const getCourse = (courseSlug: string) => fetchCourse(courseSlug);
export const getLesson = (courseSlug: string, lessonSlug: string) => fetchLesson(courseSlug, lessonSlug);
