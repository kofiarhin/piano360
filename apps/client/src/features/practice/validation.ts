import type { ManualValidationAction, ValidationResult, Validator } from "./types";

type ManualInput = {
  action: ManualValidationAction;
  stepId: string;
  message?: string;
};

const isManualInput = (input: unknown): input is ManualInput => {
  return (
    typeof input === "object" &&
    input !== null &&
    "action" in input &&
    "stepId" in input &&
    typeof (input as ManualInput).stepId === "string"
  );
};

export class ManualValidator implements Validator {
  mode = "manual" as const;

  validate(input: unknown): ValidationResult {
    if (!isManualInput(input)) {
      throw new Error("Manual validation requires an action and stepId.");
    }

    return {
      mode: this.mode,
      status: input.action,
      stepId: input.stepId,
      timestamp: new Date().toISOString(),
      confidence: 1,
      message: input.message
    };
  }
}

export const manualValidator = new ManualValidator();
