import { loadProgress, recordLessonCompletion, resetStoredProgress } from "./progressStorage";

describe("course progress storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses the locked localStorage key and records lesson metrics", () => {
    const state = recordLessonCompletion(loadProgress().progress, {
      courseSlug: "finger-placement",
      lessonSlug: "middle-c-anchor",
      completedAt: "2026-01-01T00:00:05.000Z",
      correctInputs: 3,
      incorrectInputs: 1,
      accuracy: 0.75,
      durationMs: 4000,
      restartCount: 1
    });

    expect(window.localStorage.getItem("piano360.progress.v1")).toContain("middle-c-anchor");
    expect(state.progress.lessonStats["finger-placement/middle-c-anchor"]).toMatchObject({
      correctInputs: 3,
      incorrectInputs: 1,
      accuracy: 0.75,
      durationMs: 4000,
      restartCount: 1
    });
  });

  it("resets corrupt progress safely", () => {
    window.localStorage.setItem("piano360.progress.v1", "not-json");

    expect(loadProgress()).toMatchObject({
      storageAvailable: false,
      progress: {
        completedLessons: {}
      }
    });
  });

  it("resets stored progress", () => {
    window.localStorage.setItem("piano360.progress.v1", "{}");

    const state = resetStoredProgress();

    expect(state.progress.completedLessons).toEqual({});
    expect(window.localStorage.getItem("piano360.progress.v1")).toContain("completedLessons");
  });

  it("stores optional guided-play rhythm metrics without changing the storage key", () => {
    const state = recordLessonCompletion(loadProgress().progress, {
      courseSlug: "finger-placement",
      lessonSlug: "middle-c-anchor",
      completedAt: "2026-01-01T00:00:05.000Z",
      correctInputs: 2,
      incorrectInputs: 1,
      accuracy: 2 / 3,
      durationMs: 6000,
      restartCount: 0,
      score: 170,
      maxPossibleScore: 300,
      scorePercent: 170 / 300,
      maxCombo: 2,
      fullyCorrectInputs: 2,
      eventAccuracy: 2 / 3,
      perfectInputs: 1,
      goodInputs: 1,
      earlyInputs: 0,
      lateInputs: 0,
      partialInputs: 0,
      missedInputs: 1,
      wrongInputs: 3,
      meanAbsoluteTimingErrorMs: 45,
      rhythmicAccuracy: 170 / 300
    });

    expect(window.localStorage.getItem("piano360.progress.v1")).toContain("scorePercent");
    expect(state.progress.lessonStats["finger-placement/middle-c-anchor"]).toMatchObject({
      score: 170,
      maxCombo: 2,
      fullyCorrectInputs: 2,
      eventAccuracy: 2 / 3,
      wrongInputs: 3,
      completionCount: 1
    });
  });

  it("loads existing progress records that do not have guided-play rhythm fields", () => {
    window.localStorage.setItem(
      "piano360.progress.v1",
      JSON.stringify({
        schemaVersion: 1,
        completedLessons: { "finger-placement": ["middle-c-anchor"] },
        lessonStats: {
          "finger-placement/middle-c-anchor": {
            courseSlug: "finger-placement",
            lessonSlug: "middle-c-anchor",
            completedAt: "2026-01-01T00:00:05.000Z",
            correctInputs: 3,
            incorrectInputs: 1,
            accuracy: 0.75,
            durationMs: 4000,
            restartCount: 0,
            completionCount: 1
          }
        }
      })
    );

    expect(loadProgress().progress.lessonStats["finger-placement/middle-c-anchor"]).toMatchObject({
      correctInputs: 3,
      completionCount: 1
    });
  });

  it("increments completion count once per explicit recorded completion", () => {
    const first = recordLessonCompletion(loadProgress().progress, {
      courseSlug: "finger-placement",
      lessonSlug: "middle-c-anchor",
      completedAt: "2026-01-01T00:00:05.000Z",
      correctInputs: 1,
      incorrectInputs: 0,
      accuracy: 1,
      durationMs: 1000,
      restartCount: 0
    });
    const second = recordLessonCompletion(first.progress, {
      courseSlug: "finger-placement",
      lessonSlug: "middle-c-anchor",
      completedAt: "2026-01-01T00:00:10.000Z",
      correctInputs: 1,
      incorrectInputs: 0,
      accuracy: 1,
      durationMs: 1000,
      restartCount: 1
    });

    expect(second.progress.completedLessons["finger-placement"]).toEqual(["middle-c-anchor"]);
    expect(second.progress.lessonStats["finger-placement/middle-c-anchor"]).toMatchObject({
      completionCount: 2,
      restartCount: 1
    });
  });
});
