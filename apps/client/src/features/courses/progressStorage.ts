import type { Course, Lesson } from "./courseTypes";
import type { LessonMetrics } from "./lessonEngine";

export const PROGRESS_STORAGE_KEY = "piano360.progress.v1";
export const PROGRESS_SCHEMA_VERSION = 1 as const;

export type LessonProgressRecord = LessonMetrics & {
  courseSlug: string;
  lessonSlug: string;
  completedAt: string;
  completionCount: number;
};

export type CourseProgressSnapshot = {
  schemaVersion: 1;
  completedLessons: Record<string, string[]>;
  lessonStats: Record<string, LessonProgressRecord>;
};

export type ProgressStorageState = {
  progress: CourseProgressSnapshot;
  storageAvailable: boolean;
  storageIssue?: string;
};

export type LessonCompletionInput = Omit<LessonProgressRecord, "completionCount">;

export const lessonProgressKey = (courseSlug: string, lessonSlug: string) => `${courseSlug}/${lessonSlug}`;

export const createEmptyProgress = (): CourseProgressSnapshot => ({
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  completedLessons: {},
  lessonStats: {}
});

const hasStorage = () => typeof window !== "undefined" && "localStorage" in window;

const isValidProgress = (value: unknown): value is CourseProgressSnapshot => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CourseProgressSnapshot>;
  return (
    candidate.schemaVersion === PROGRESS_SCHEMA_VERSION &&
    typeof candidate.completedLessons === "object" &&
    typeof candidate.lessonStats === "object"
  );
};

export const loadProgress = (): ProgressStorageState => {
  if (!hasStorage()) {
    return {
      progress: createEmptyProgress(),
      storageAvailable: false,
      storageIssue: "Local storage is unavailable in this browser."
    };
  }

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return { progress: createEmptyProgress(), storageAvailable: true };
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isValidProgress(parsed)) {
      return {
        progress: createEmptyProgress(),
        storageAvailable: true,
        storageIssue: "Saved progress was reset because it did not match the current schema."
      };
    }

    return { progress: parsed, storageAvailable: true };
  } catch {
    return {
      progress: createEmptyProgress(),
      storageAvailable: false,
      storageIssue: "Saved progress could not be read, so this session is using a fresh local snapshot."
    };
  }
};

export const saveProgress = (progress: CourseProgressSnapshot): ProgressStorageState => {
  if (!hasStorage()) {
    return {
      progress,
      storageAvailable: false,
      storageIssue: "Local storage is unavailable in this browser."
    };
  }

  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return { progress, storageAvailable: true };
  } catch {
    return {
      progress,
      storageAvailable: false,
      storageIssue: "Progress could not be saved on this device."
    };
  }
};

export const recordLessonCompletion = (
  progress: CourseProgressSnapshot,
  completion: LessonCompletionInput
): ProgressStorageState => {
  const key = lessonProgressKey(completion.courseSlug, completion.lessonSlug);
  const existingCourseLessons = progress.completedLessons[completion.courseSlug] ?? [];
  const completedLessons = existingCourseLessons.includes(completion.lessonSlug)
    ? existingCourseLessons
    : [...existingCourseLessons, completion.lessonSlug];
  const previousStats = progress.lessonStats[key];
  const nextProgress: CourseProgressSnapshot = {
    ...progress,
    completedLessons: {
      ...progress.completedLessons,
      [completion.courseSlug]: completedLessons
    },
    lessonStats: {
      ...progress.lessonStats,
      [key]: {
        ...completion,
        completionCount: (previousStats?.completionCount ?? 0) + 1
      }
    }
  };

  return saveProgress(nextProgress);
};

export const resetStoredProgress = () => saveProgress(createEmptyProgress());

export const isLessonCompleted = (
  progress: CourseProgressSnapshot,
  courseSlug: string,
  lessonSlug: string
) => Boolean(progress.completedLessons[courseSlug]?.includes(lessonSlug));

export const isLessonUnlocked = (
  progress: CourseProgressSnapshot,
  course: Course,
  lesson: Lesson
) => {
  const orderedLessons = [...course.lessons].sort((first, second) => first.order - second.order);
  const index = orderedLessons.findIndex((item) => item.slug === lesson.slug);

  if (index <= 0) {
    return index === 0;
  }

  const previousLesson = orderedLessons[index - 1];
  return previousLesson ? isLessonCompleted(progress, course.slug, previousLesson.slug) : false;
};
