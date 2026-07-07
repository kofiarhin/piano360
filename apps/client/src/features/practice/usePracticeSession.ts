import { useMemo, useReducer } from "react";

import type { Exercise } from "../../content";
import { applyValidationResult, getCurrentStep, initializeSession, restartSession, summarizeSession } from "./practiceEngine";
import { manualValidator } from "./validation";
import type { ManualValidationAction, PracticeSession, ValidationResult } from "./types";

type PracticeAction =
  | { type: "validate"; result: ValidationResult; now?: Date }
  | { type: "restart"; now?: Date };

const createReducer = (exercise: Exercise) => (state: PracticeSession, action: PracticeAction): PracticeSession => {
  if (action.type === "restart") {
    return restartSession(exercise, action.now);
  }

  return applyValidationResult(state, exercise, action.result, action.now);
};

export const usePracticeSession = (exercise: Exercise) => {
  const reducer = useMemo(() => createReducer(exercise), [exercise]);
  const [session, dispatch] = useReducer(reducer, exercise, initializeSession);
  const currentStep = getCurrentStep(session, exercise);

  const validateManually = (action: ManualValidationAction) => {
    if (!currentStep) {
      return;
    }

    const result = manualValidator.validate({
      action,
      stepId: currentStep.id
    });

    dispatch({ type: "validate", result });
  };

  const restart = () => dispatch({ type: "restart" });

  return {
    session,
    currentStep,
    summary: summarizeSession(session),
    validateManually,
    restart
  };
};
