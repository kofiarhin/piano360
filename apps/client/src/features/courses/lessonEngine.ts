import { matchChordInput } from "./chordMatcher";
import type { GuidedStepLessonDetail, NoteId } from "./courseTypes";

export const CHORD_INPUT_WINDOW_MS = 350;

export type LessonFeedback = "idle" | "correct" | "incorrect" | "completed";
export type LessonSessionStatus = "active" | "completed";

export type LessonMetrics = {
  correctInputs: number;
  incorrectInputs: number;
  accuracy: number;
  durationMs: number;
  restartCount: number;
  score?: number;
  maxPossibleScore?: number;
  scorePercent?: number;
  maxCombo?: number;
  perfectInputs?: number;
  goodInputs?: number;
  earlyInputs?: number;
  lateInputs?: number;
  partialInputs?: number;
  acceptedInputs?: number;
  missedInputs?: number;
  wrongInputs?: number;
  meanAbsoluteTimingErrorMs?: number;
  rhythmicAccuracy?: number;
};

export type ChordAttempt = {
  stepId: string;
  startedAt: string;
  collectedNotes: NoteId[];
};

export type LessonSession = {
  lessonSlug: string;
  currentStepIndex: number;
  status: LessonSessionStatus;
  feedback: LessonFeedback;
  metrics: LessonMetrics;
  activeNotes: NoteId[];
  startedAt?: string;
  completedAt?: string;
  chordAttempt?: ChordAttempt;
};

const emptyMetrics = (restartCount = 0): LessonMetrics => ({
  correctInputs: 0,
  incorrectInputs: 0,
  accuracy: 0,
  durationMs: 0,
  restartCount
});

export const initializeLessonSession = (lesson: GuidedStepLessonDetail): LessonSession => ({
  lessonSlug: lesson.slug,
  currentStepIndex: 0,
  status: "active",
  feedback: "idle",
  metrics: emptyMetrics(),
  activeNotes: []
});

const currentStep = (session: LessonSession, lesson: GuidedStepLessonDetail) =>
  lesson.steps[session.currentStepIndex];

const withStartedAt = (session: LessonSession, now: Date): LessonSession => ({
  ...session,
  startedAt: session.startedAt ?? now.toISOString()
});

const withAccuracy = (metrics: LessonMetrics): LessonMetrics => {
  const total = metrics.correctInputs + metrics.incorrectInputs;
  return {
    ...metrics,
    accuracy: total === 0 ? 0 : metrics.correctInputs / total
  };
};

const completeIfNeeded = (
  session: LessonSession,
  lesson: GuidedStepLessonDetail,
  now: Date
): LessonSession => {
  if (session.currentStepIndex < lesson.steps.length) {
    return session;
  }

  const completedAt = now.toISOString();
  const startedAt = session.startedAt ?? completedAt;

  return {
    ...session,
    currentStepIndex: lesson.steps.length - 1,
    status: "completed",
    feedback: "completed",
    completedAt,
    chordAttempt: undefined,
    activeNotes: [],
    metrics: withAccuracy({
      ...session.metrics,
      durationMs: Math.max(0, now.getTime() - new Date(startedAt).getTime())
    })
  };
};

const recordCorrect = (
  session: LessonSession,
  lesson: GuidedStepLessonDetail,
  now: Date
): LessonSession => {
  const nextSession: LessonSession = {
    ...session,
    currentStepIndex: session.currentStepIndex + 1,
    feedback: "correct",
    chordAttempt: undefined,
    activeNotes: [],
    metrics: withAccuracy({
      ...session.metrics,
      correctInputs: session.metrics.correctInputs + 1
    })
  };

  return completeIfNeeded(nextSession, lesson, now);
};

const recordIncorrect = (session: LessonSession): LessonSession => ({
  ...session,
  feedback: "incorrect",
  chordAttempt: undefined,
  activeNotes: [],
  metrics: withAccuracy({
    ...session.metrics,
    incorrectInputs: session.metrics.incorrectInputs + 1
  })
});

const appendUniqueNote = (notes: NoteId[], note: NoteId) =>
  notes.includes(note) ? notes : [...notes, note];

export const applyNoteInput = (
  currentSession: LessonSession,
  lesson: GuidedStepLessonDetail,
  note: NoteId,
  now = new Date()
): LessonSession => {
  if (currentSession.status === "completed") {
    return currentSession;
  }

  const session = withStartedAt(currentSession, now);
  const step = currentStep(session, lesson);

  if (!step) {
    return completeIfNeeded(session, lesson, now);
  }

  if (step.type === "single-note") {
    return step.targetNotes[0] === note
      ? recordCorrect(session, lesson, now)
      : recordIncorrect(session);
  }

  const collectedNotes = appendUniqueNote(session.chordAttempt?.collectedNotes ?? [], note);
  const result = matchChordInput(step.targetNotes, collectedNotes);

  if (result === "incorrect") {
    return recordIncorrect(session);
  }

  if (result === "correct") {
    return recordCorrect(
      {
        ...session,
        activeNotes: collectedNotes
      },
      lesson,
      now
    );
  }

  return {
    ...session,
    feedback: "idle",
    activeNotes: collectedNotes,
    chordAttempt: {
      stepId: step.id,
      startedAt: session.chordAttempt?.startedAt ?? now.toISOString(),
      collectedNotes
    }
  };
};

export const expireChordWindow = (
  session: LessonSession,
  lesson: GuidedStepLessonDetail,
  now = new Date()
): LessonSession => {
  if (!session.chordAttempt || session.status === "completed") {
    return session;
  }

  const step = currentStep(session, lesson);
  if (!step || step.type !== "chord") {
    return session;
  }

  const elapsed = now.getTime() - new Date(session.chordAttempt.startedAt).getTime();
  if (elapsed < CHORD_INPUT_WINDOW_MS) {
    return session;
  }

  return matchChordInput(step.targetNotes, session.chordAttempt.collectedNotes) === "correct"
    ? recordCorrect(session, lesson, now)
    : recordIncorrect(session);
};

export const restartLessonSession = (
  session: LessonSession,
  lesson: GuidedStepLessonDetail
): LessonSession => ({
  ...initializeLessonSession(lesson),
  metrics: emptyMetrics(session.metrics.restartCount + 1)
});

export const getCompletionSummary = (session: LessonSession) => {
  if (session.status !== "completed" || !session.completedAt) {
    return undefined;
  }

  return {
    completedAt: session.completedAt,
    correctInputs: session.metrics.correctInputs,
    incorrectInputs: session.metrics.incorrectInputs,
    accuracy: session.metrics.accuracy,
    durationMs: session.metrics.durationMs,
    restartCount: session.metrics.restartCount
  };
};
