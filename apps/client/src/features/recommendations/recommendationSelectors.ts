import { exercises } from "../../content";
import type { Recommendation } from "./recommendationEngine";

export const getRecommendationLabel = (recommendation: Recommendation) => {
  if (recommendation.type === "free-practice") {
    return "Review in free practice";
  }

  const exercise = exercises.find((item) => item.id === recommendation.exerciseId);
  return exercise?.title ?? "Continue practice";
};
