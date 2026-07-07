import { createEmptyProgress } from "../progress/storage";
import { getRecommendation } from "./recommendationEngine";

describe("recommendation engine", () => {
  it("continues the last active incomplete exercise", () => {
    const progress = createEmptyProgress();
    progress.lastActiveExerciseId = "right-hand-five-fingers";
    progress.completedExerciseIds = ["middle-c-anchor"];

    expect(getRecommendation(progress)).toEqual({
      type: "exercise",
      reason: "continue",
      exerciseId: "right-hand-five-fingers"
    });
  });

  it("returns the first unlocked incomplete exercise", () => {
    const progress = createEmptyProgress();

    expect(getRecommendation(progress)).toEqual({
      type: "exercise",
      reason: "next-unlocked",
      exerciseId: "middle-c-anchor"
    });
  });

  it("returns free practice when the path is complete", () => {
    const progress = createEmptyProgress();
    progress.completedExerciseIds = [
      "middle-c-anchor",
      "right-hand-five-fingers",
      "left-hand-five-fingers",
      "step-and-skip-drill",
      "fourth-fifth-reach",
      "c-major-triad-shape",
      "a-minor-triad-shape",
      "basic-i-iv-v-i"
    ];

    expect(getRecommendation(progress)).toEqual({
      type: "free-practice",
      reason: "review"
    });
  });
});
