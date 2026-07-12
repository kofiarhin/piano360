import type { GuidedStepLessonDetail } from "./courseTypes";
import {
  applyNoteInput,
  expireChordWindow,
  initializeLessonSession,
  restartLessonSession
} from "./lessonEngine";

const lesson: GuidedStepLessonDetail = {
  courseSlug: "beginner-chords",
  courseTitle: "Beginner Chords",
  courseHand: "right",
  slug: "test-lesson",
  title: "Test Lesson",
  description: "A test lesson.",
  order: 1,
  isFinal: false,
  steps: [
    {
      id: "c4",
      type: "single-note",
      instruction: "Play C4.",
      targetNotes: ["C4"]
    },
    {
      id: "c-major",
      type: "chord",
      instruction: "Play C major.",
      targetNotes: ["C4", "E4", "G4"]
    }
  ]
};

describe("lesson engine", () => {
  it("validates single notes, starts timer on first input, and completes after final success", () => {
    let session = initializeLessonSession(lesson);

    session = applyNoteInput(session, lesson, "D4", new Date("2026-01-01T00:00:01.000Z"));
    expect(session.metrics).toMatchObject({ correctInputs: 0, incorrectInputs: 1 });
    expect(session.currentStepIndex).toBe(0);
    expect(session.startedAt).toBe("2026-01-01T00:00:01.000Z");

    session = applyNoteInput(session, lesson, "C4", new Date("2026-01-01T00:00:02.000Z"));
    expect(session.metrics).toMatchObject({ correctInputs: 1, incorrectInputs: 1 });
    expect(session.currentStepIndex).toBe(1);

    session = applyNoteInput(session, lesson, "C4", new Date("2026-01-01T00:00:03.000Z"));
    session = applyNoteInput(session, lesson, "E4", new Date("2026-01-01T00:00:03.100Z"));
    session = applyNoteInput(session, lesson, "G4", new Date("2026-01-01T00:00:03.200Z"));

    expect(session.status).toBe("completed");
    expect(session.completedAt).toBe("2026-01-01T00:00:03.200Z");
    expect(session.metrics).toMatchObject({
      correctInputs: 2,
      incorrectInputs: 1,
      durationMs: 2200
    });
  });

  it("rejects chord extras immediately and counts one incorrect input", () => {
    let session = initializeLessonSession(lesson);
    session = applyNoteInput(session, lesson, "C4");
    session = applyNoteInput(session, lesson, "C4");
    session = applyNoteInput(session, lesson, "D4");

    expect(session.currentStepIndex).toBe(1);
    expect(session.feedback).toBe("incorrect");
    expect(session.chordAttempt).toBeUndefined();
    expect(session.metrics.incorrectInputs).toBe(1);
  });

  it("fails an incomplete chord when the 350 ms window expires", () => {
    let session = initializeLessonSession(lesson);
    session = applyNoteInput(session, lesson, "C4", new Date("2026-01-01T00:00:01.000Z"));
    session = applyNoteInput(session, lesson, "C4", new Date("2026-01-01T00:00:02.000Z"));
    session = applyNoteInput(session, lesson, "E4", new Date("2026-01-01T00:00:02.100Z"));
    session = expireChordWindow(session, lesson, new Date("2026-01-01T00:00:02.451Z"));

    expect(session.currentStepIndex).toBe(1);
    expect(session.feedback).toBe("incorrect");
    expect(session.chordAttempt).toBeUndefined();
    expect(session.metrics.incorrectInputs).toBe(1);
  });

  it("restarts the current attempt without erasing saved completions elsewhere", () => {
    let session = initializeLessonSession(lesson);
    session = applyNoteInput(session, lesson, "D4");

    const restarted = restartLessonSession(session, lesson);

    expect(restarted.currentStepIndex).toBe(0);
    expect(restarted.metrics).toMatchObject({
      correctInputs: 0,
      incorrectInputs: 0,
      restartCount: 1
    });
    expect(restarted.startedAt).toBeUndefined();
  });
});
