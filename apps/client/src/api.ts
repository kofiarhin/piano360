import type { Course, CourseFilters, CourseSummary, LessonDetail } from "./features/courses/courseTypes";

export type ApiHealth = {
  service: string;
  status: string;
  timestamp: string;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export const getApiBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_API_URL as string | undefined;
  return configuredUrl ? trimTrailingSlash(configuredUrl) : "/api";
};

export const fetchHealth = async (): Promise<ApiHealth> => {
  const response = await fetch(`${getApiBaseUrl()}/health`);

  if (!response.ok) {
    throw new Error(`API health request failed with ${response.status}`);
  }

  return (await response.json()) as ApiHealth;
};

const parseJsonResponse = async <T>(response: Response, label: string): Promise<T> => {
  if (!response.ok) {
    throw new Error(`${label} request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

const filtersToQuery = (filters: CourseFilters = {}) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchCourses = async (filters?: CourseFilters): Promise<CourseSummary[]> => {
  const response = await fetch(`${getApiBaseUrl()}/courses${filtersToQuery(filters)}`);

  return parseJsonResponse<CourseSummary[]>(response, "Courses");
};

export const fetchCourse = async (courseSlug: string): Promise<Course> => {
  const response = await fetch(`${getApiBaseUrl()}/courses/${encodeURIComponent(courseSlug)}`);

  return parseJsonResponse<Course>(response, "Course detail");
};

export const fetchLesson = async (courseSlug: string, lessonSlug: string): Promise<LessonDetail> => {
  const response = await fetch(
    `${getApiBaseUrl()}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`
  );

  return parseJsonResponse<LessonDetail>(response, "Lesson detail");
};
