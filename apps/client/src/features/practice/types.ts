import type { PracticeStep, ValidationMode } from "../../content";

export type PracticeSessionStatus = "idle" | "active" | "completed" | "abandoned";

export type PracticeStepStatus = "pending" | "correct" | "retry" | "skipped";

export type ValidationResult = {
  mode: ValidationMode;
  status: "correct" | "incorrect" | "skipped" | "low-confidence";
  stepId: string;
  timestamp: string;
  confidence?: number;
  detectedNotes?: string[];
  message?: string;
};

export type Validator = {
  mode: ValidationMode;
  validate(input: unknown): Promise<ValidationResult> | ValidationResult;
};

export type PracticeAttempt = {
  stepId: string;
  result: ValidationResult;
};

export type PracticeSession = {
  exerciseId: string;
  startedAt: string;
  currentStepIndex: number;
  stepResults: Record<string, PracticeStepStatus>;
  attempts: PracticeAttempt[];
  status: PracticeSessionStatus;
  completedAt?: string;
};

export type PracticeSummary = {
  exerciseId: string;
  completedAt: string;
  attempts: number;
  correctAttempts: number;
  retryAttempts: number;
  skippedSteps: number;
};

export type ManualValidationAction = "correct" | "incorrect" | "skipped";

export type CurrentPracticeStep = PracticeStep | undefined;
