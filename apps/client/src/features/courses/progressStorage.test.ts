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
});
