import { exercises } from "../../content";
import { isExerciseUnlocked } from "../progress/progressSelectors";
import type { ProgressSnapshot } from "../progress/types";

export type Recommendation =
  | {
      type: "exercise";
      reason: "continue" | "next-unlocked";
      exerciseId: string;
    }
  | {
      type: "free-practice";
      reason: "review";
    };

export const getRecommendation = (progress: ProgressSnapshot): Recommendation => {
  const lastActiveExerciseId = progress.lastActiveExerciseId;

  if (lastActiveExerciseId && !progress.completedExerciseIds.includes(lastActiveExerciseId)) {
    return {
      type: "exercise",
      reason: "continue",
      exerciseId: lastActiveExerciseId
    };
  }

  const next = exercises.find(
    (exercise) => !progress.completedExerciseIds.includes(exercise.id) && isExerciseUnlocked(progress, exercise.id)
  );

  if (next) {
    return {
      type: "exercise",
      reason: "next-unlocked",
      exerciseId: next.id
    };
  }

  return {
    type: "free-practice",
    reason: "review"
  };
};
