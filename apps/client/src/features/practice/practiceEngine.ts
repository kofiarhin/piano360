import type { Exercise } from "../../content";
import type { PracticeSession, PracticeStepStatus, PracticeSummary, ValidationResult } from "./types";

export const initializeSession = (exercise: Exercise, now = new Date()): PracticeSession => ({
  exerciseId: exercise.id,
  startedAt: now.toISOString(),
  currentStepIndex: 0,
  stepResults: Object.fromEntries(exercise.steps.map((step) => [step.id, "pending" as PracticeStepStatus])),
  attempts: [],
  status: "active"
});

export const getCurrentStep = (session: PracticeSession, exercise: Exercise) => {
  return exercise.steps[session.currentStepIndex];
};

const resultToStepStatus = (result: ValidationResult): PracticeStepStatus => {
  if (result.status === "correct") {
    return "correct";
  }

  if (result.status === "skipped") {
    return "skipped";
  }

  return "retry";
};

const canAdvance = (result: ValidationResult, exercise: Exercise) => {
  const step = exercise.steps.find((item) => item.id === result.stepId);

  if (result.status === "correct") {
    return true;
  }

  if (result.status === "skipped") {
    return Boolean(step?.skippable);
  }

  return false;
};

const withCompletionIfNeeded = (session: PracticeSession, exercise: Exercise, now: Date): PracticeSession => {
  const completed = session.currentStepIndex >= exercise.steps.length;

  if (!completed) {
    return session;
  }

  return {
    ...session,
    currentStepIndex: exercise.steps.length - 1,
    status: "completed",
    completedAt: now.toISOString()
  };
};

export const applyValidationResult = (
  session: PracticeSession,
  exercise: Exercise,
  result: ValidationResult,
  now = new Date()
): PracticeSession => {
  if (session.status === "completed") {
    return session;
  }

  const stepStatus = resultToStepStatus(result);
  const nextIndex = canAdvance(result, exercise) ? session.currentStepIndex + 1 : session.currentStepIndex;
  const nextSession: PracticeSession = {
    ...session,
    currentStepIndex: nextIndex,
    stepResults: {
      ...session.stepResults,
      [result.stepId]: stepStatus
    },
    attempts: [...session.attempts, { stepId: result.stepId, result }]
  };

  return withCompletionIfNeeded(nextSession, exercise, now);
};

export const restartSession = (exercise: Exercise, now = new Date()) => initializeSession(exercise, now);

export const summarizeSession = (session: PracticeSession): PracticeSummary | undefined => {
  if (session.status !== "completed" || !session.completedAt) {
    return undefined;
  }

  const correctAttempts = session.attempts.filter((attempt) => attempt.result.status === "correct").length;
  const retryAttempts = session.attempts.filter((attempt) => attempt.result.status === "incorrect").length;
  const skippedSteps = Object.values(session.stepResults).filter((status) => status === "skipped").length;

  return {
    exerciseId: session.exerciseId,
    completedAt: session.completedAt,
    attempts: session.attempts.length,
    correctAttempts,
    retryAttempts,
    skippedSteps
  };
};
