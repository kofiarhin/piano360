import { CONTENT_VERSION, exercises } from "../../content";
import type { PracticeSummary } from "../practice/types";
import type { ProgressSnapshot, ProgressStorageState, SkillProgress } from "./types";

export const PROGRESS_STORAGE_KEY = "piano360.progress.v1";
export const PROGRESS_SCHEMA_VERSION = 1 as const;

export const createEmptyProgress = (): ProgressSnapshot => ({
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  contentVersion: CONTENT_VERSION,
  completedExerciseIds: [],
  exerciseStats: {},
  skillStats: {},
  currentStreak: 0,
  recentExerciseIds: [],
  totalPracticeSessions: 0
});

const hasStorage = () => typeof window !== "undefined" && "localStorage" in window;

const isValidProgress = (value: unknown): value is ProgressSnapshot => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ProgressSnapshot>;
  return (
    candidate.schemaVersion === PROGRESS_SCHEMA_VERSION &&
    typeof candidate.contentVersion === "string" &&
    Array.isArray(candidate.completedExerciseIds) &&
    typeof candidate.exerciseStats === "object" &&
    typeof candidate.skillStats === "object" &&
    Array.isArray(candidate.recentExerciseIds) &&
    typeof candidate.currentStreak === "number" &&
    typeof candidate.totalPracticeSessions === "number"
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

    if (!isValidProgress(parsed) || parsed.contentVersion !== CONTENT_VERSION) {
      return {
        progress: createEmptyProgress(),
        storageAvailable: true,
        storageIssue: "Saved progress was reset because it no longer matched this content version."
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

export const saveProgress = (progress: ProgressSnapshot): ProgressStorageState => {
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

const dateKey = (iso: string) => iso.slice(0, 10);

const daysBetween = (a: string, b: string) => {
  const first = new Date(`${a}T00:00:00.000Z`).getTime();
  const second = new Date(`${b}T00:00:00.000Z`).getTime();
  return Math.round((second - first) / 86_400_000);
};

const updateStreak = (progress: ProgressSnapshot, completedAt: string) => {
  const today = dateKey(completedAt);

  if (!progress.lastPracticedDate) {
    return 1;
  }

  if (progress.lastPracticedDate === today) {
    return progress.currentStreak;
  }

  return daysBetween(progress.lastPracticedDate, today) === 1 ? progress.currentStreak + 1 : 1;
};

const masteryFromConfidence = (confidence: number): SkillProgress["mastery"] => {
  if (confidence >= 0.9) {
    return "mastered";
  }

  if (confidence >= 0.75) {
    return "comfortable";
  }

  if (confidence >= 0.45) {
    return "practicing";
  }

  return "introduced";
};

export const recordExerciseCompletion = (
  progress: ProgressSnapshot,
  summary: PracticeSummary
): ProgressSnapshot => {
  const exercise = exercises.find((item) => item.id === summary.exerciseId);
  const completedExerciseIds = progress.completedExerciseIds.includes(summary.exerciseId)
    ? progress.completedExerciseIds
    : [...progress.completedExerciseIds, summary.exerciseId];
  const existing = progress.exerciseStats[summary.exerciseId];
  const exerciseStats = {
    ...progress.exerciseStats,
    [summary.exerciseId]: {
      exerciseId: summary.exerciseId,
      completedAt: summary.completedAt,
      attempts: (existing?.attempts ?? 0) + summary.attempts,
      correctAttempts: (existing?.correctAttempts ?? 0) + summary.correctAttempts,
      retryAttempts: (existing?.retryAttempts ?? 0) + summary.retryAttempts,
      skippedSteps: (existing?.skippedSteps ?? 0) + summary.skippedSteps,
      completionCount: (existing?.completionCount ?? 0) + 1,
      lastPracticedAt: summary.completedAt
    }
  };

  const skillStats = { ...progress.skillStats };

  for (const skillId of exercise?.skillIds ?? []) {
    const previous = skillStats[skillId];
    const correct = (previous?.correctCount ?? 0) + summary.correctAttempts;
    const retry = (previous?.retryCount ?? 0) + summary.retryAttempts + summary.skippedSteps;
    const practiceCount = (previous?.practiceCount ?? 0) + 1;
    const confidence = correct + retry === 0 ? 0 : correct / (correct + retry);

    skillStats[skillId] = {
      skillId,
      practiceCount,
      correctCount: correct,
      retryCount: retry,
      confidence,
      mastery: masteryFromConfidence(confidence),
      lastPracticedAt: summary.completedAt
    };
  }

  return {
    ...progress,
    contentVersion: CONTENT_VERSION,
    completedExerciseIds,
    exerciseStats,
    skillStats,
    currentStreak: updateStreak(progress, summary.completedAt),
    lastPracticedDate: dateKey(summary.completedAt),
    recentExerciseIds: [
      summary.exerciseId,
      ...progress.recentExerciseIds.filter((exerciseId) => exerciseId !== summary.exerciseId)
    ].slice(0, 5),
    lastActiveExerciseId: summary.exerciseId,
    totalPracticeSessions: progress.totalPracticeSessions + 1
  };
};

export const recordActiveExercise = (progress: ProgressSnapshot, exerciseId: string): ProgressSnapshot => ({
  ...progress,
  lastActiveExerciseId: exerciseId
});

export const resetStoredProgress = () => saveProgress(createEmptyProgress());
