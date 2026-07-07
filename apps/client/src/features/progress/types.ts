import type { SkillMastery } from "../../content";

export type ExerciseProgress = {
  exerciseId: string;
  completedAt?: string;
  attempts: number;
  correctAttempts: number;
  retryAttempts: number;
  skippedSteps: number;
  completionCount: number;
  lastPracticedAt: string;
};

export type SkillProgress = {
  skillId: string;
  practiceCount: number;
  correctCount: number;
  retryCount: number;
  confidence: number;
  mastery: SkillMastery;
  lastPracticedAt?: string;
};

export type ProgressSnapshot = {
  schemaVersion: 1;
  contentVersion: string;
  completedExerciseIds: string[];
  exerciseStats: Record<string, ExerciseProgress>;
  skillStats: Record<string, SkillProgress>;
  lastPracticedDate?: string;
  currentStreak: number;
  recentExerciseIds: string[];
  lastActiveExerciseId?: string;
  totalPracticeSessions: number;
};

export type ProgressStorageState = {
  progress: ProgressSnapshot;
  storageAvailable: boolean;
  storageIssue?: string;
};
