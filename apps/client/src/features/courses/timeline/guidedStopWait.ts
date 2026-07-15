import type { NoteId, TimedNoteEvent } from "../courseTypes";
import { beatToMilliseconds } from "./timelineMath";
import type { TimingWindows } from "./timingJudge";

export type GuidedStopWaitPhase =
  | "idle"
  | "approaching"
  | "waiting-for-input"
  | "collecting-chord"
  | "holding"
  | "waiting-for-release"
  | "success-confirmation"
  | "manual-pause"
  | "completed";

type PauseReturnPhase = Exclude<GuidedStopWaitPhase, "manual-pause" | "completed">;

export type GuidedStopWaitState = {
  activeEventId?: string;
  phase: GuidedStopWaitPhase;
  lockedBeat?: number;
  activeNotes: NoteId[];
  requiredNotes: NoteId[];
  pressedTargetNotes: NoteId[];
  completedEventIds: string[];
  holdStartedAt?: number;
  releasedTargetNotes: NoteId[];
  confirmationUntil?: number;
  manualPauseState?: {
    returnPhase: PauseReturnPhase;
  };
  wrongNoteCount: number;
  retryCountByEventId: Record<string, number>;
  feedback?: string;
};

export type GuidedStopWaitOutcome =
  | { type: "ignored"; state: GuidedStopWaitState }
  | { type: "wrong"; state: GuidedStopWaitState; label: string }
  | { type: "progress"; state: GuidedStopWaitState; label: string }
  | { type: "retry"; state: GuidedStopWaitState; label: "Hold longer" }
  | { type: "completed"; state: GuidedStopWaitState; label: "Good" };

const uniqueNotes = (notes: NoteId[]) => [...new Set(notes)];

const noteList = (notes: NoteId[]) => notes.join(" and ");

const promptFor = (event?: TimedNoteEvent, state?: GuidedStopWaitState) => {
  if (!event) return "Complete";
  if (state?.phase === "holding") {
    return event.notes.length > 1 ? "Keep holding the chord" : `Hold ${event.notes[0]}`;
  }
  if (state?.phase === "waiting-for-release") return "Release";
  if (event.notes.length > 1) {
    const pressed = new Set(state?.pressedTargetNotes ?? []);
    const remaining = event.notes.filter((note) => !pressed.has(note));
    return remaining.length && remaining.length < event.notes.length
      ? `Add ${noteList(remaining)}`
      : "Play the full chord";
  }
  return `Play ${event.notes[0]}`;
};

export const minimumStopWaitHoldMilliseconds = (
  event: TimedNoteEvent,
  bpm: number,
  windows: TimingWindows
) => {
  const durationMs = beatToMilliseconds(event.durationBeats, bpm);
  const toleranceMs = Math.min(windows.acceptedMs, durationMs * 0.35);
  return Math.max(0, durationMs - toleranceMs);
};

export const createGuidedStopWaitState = (events: TimedNoteEvent[]): GuidedStopWaitState => {
  const [firstEvent] = events;

  return {
    activeEventId: firstEvent?.id,
    phase: firstEvent ? "idle" : "completed",
    activeNotes: [],
    requiredNotes: firstEvent?.notes ?? [],
    pressedTargetNotes: [],
    completedEventIds: [],
    releasedTargetNotes: [],
    wrongNoteCount: 0,
    retryCountByEventId: {},
    feedback: firstEvent ? "Get ready" : "Complete"
  };
};

export const nextUncompletedEvent = (
  events: TimedNoteEvent[],
  completedEventIds: string[]
): TimedNoteEvent | undefined => {
  const completed = new Set(completedEventIds);
  return events.find((event) => !completed.has(event.id));
};

export const startGuidedStopWaitApproach = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent
): GuidedStopWaitState => ({
  ...state,
  activeEventId: event.id,
  phase: "approaching",
  lockedBeat: undefined,
  activeNotes: [],
  requiredNotes: event.notes,
  pressedTargetNotes: [],
  releasedTargetNotes: [],
  holdStartedAt: undefined,
  confirmationUntil: undefined,
  manualPauseState: undefined,
  feedback: event.notes.length > 1 ? "Get ready" : `Next: ${event.notes[0]}`
});

export const lockGuidedStopWaitEvent = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent
): GuidedStopWaitState => ({
  ...state,
  activeEventId: event.id,
  phase: "waiting-for-input",
  lockedBeat: event.startBeat,
  activeNotes: [],
  requiredNotes: event.notes,
  pressedTargetNotes: [],
  releasedTargetNotes: [],
  holdStartedAt: undefined,
  feedback: promptFor(event)
});

const resetAttempt = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent,
  label: string
): GuidedStopWaitState => ({
  ...state,
  activeEventId: event.id,
  phase: "waiting-for-input",
  lockedBeat: event.startBeat,
  activeNotes: [],
  requiredNotes: event.notes,
  pressedTargetNotes: [],
  releasedTargetNotes: [],
  holdStartedAt: undefined,
  retryCountByEventId: {
    ...state.retryCountByEventId,
    [event.id]: (state.retryCountByEventId[event.id] ?? 0) + 1
  },
  feedback: label
});

export const applyGuidedStopWaitPress = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent,
  note: NoteId,
  timestampMs: number
): GuidedStopWaitOutcome => {
  if (state.activeEventId !== event.id) return { type: "ignored", state };
  if (state.phase !== "waiting-for-input" && state.phase !== "collecting-chord") {
    return { type: "ignored", state };
  }

  if (!event.notes.includes(note)) {
    const label =
      event.notes.length > 1
        ? "Wrong key - play the full chord"
        : `Wrong key - play ${event.notes[0]}`;
    return {
      type: "wrong",
      state: { ...state, wrongNoteCount: state.wrongNoteCount + 1, feedback: label },
      label
    };
  }

  const pressedTargetNotes = uniqueNotes([...state.pressedTargetNotes, note]);
  const completeTarget = event.notes.every((target) => pressedTargetNotes.includes(target));
  const activeNotes = uniqueNotes([...state.activeNotes, note]);

  if (!completeTarget) {
    const nextState: GuidedStopWaitState = {
      ...state,
      phase: "collecting-chord",
      activeNotes,
      pressedTargetNotes,
      feedback: promptFor(event, { ...state, pressedTargetNotes })
    };
    return {
      type: "progress",
      state: nextState,
      label: nextState.feedback ?? "Complete the chord"
    };
  }

  const nextState: GuidedStopWaitState = {
    ...state,
    phase: "holding",
    activeNotes,
    pressedTargetNotes,
    releasedTargetNotes: [],
    holdStartedAt: timestampMs,
    feedback: promptFor(event, { ...state, phase: "holding" })
  };
  return { type: "progress", state: nextState, label: nextState.feedback ?? "Hold" };
};

export const applyGuidedStopWaitRelease = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent,
  note: NoteId,
  timestampMs: number,
  bpm: number,
  windows: TimingWindows,
  confirmationMs: number
): GuidedStopWaitOutcome => {
  if (state.activeEventId !== event.id || !event.notes.includes(note)) {
    return { type: "ignored", state };
  }

  if (state.phase === "collecting-chord") {
    return {
      type: "progress",
      state: {
        ...state,
        activeNotes: state.activeNotes.filter((activeNote) => activeNote !== note),
        pressedTargetNotes: state.pressedTargetNotes.filter((pressedNote) => pressedNote !== note),
        feedback: "Complete the chord"
      },
      label: "Complete the chord"
    };
  }

  if (state.phase !== "holding" && state.phase !== "waiting-for-release") {
    return { type: "ignored", state };
  }

  const holdStartedAt = state.holdStartedAt ?? timestampMs;
  const heldLongEnough =
    timestampMs - holdStartedAt >= minimumStopWaitHoldMilliseconds(event, bpm, windows);

  if (!heldLongEnough) {
    return {
      type: "retry",
      state: resetAttempt(state, event, "Hold longer"),
      label: "Hold longer"
    };
  }

  const releasedTargetNotes = uniqueNotes([...state.releasedTargetNotes, note]);
  const activeNotes = state.activeNotes.filter((activeNote) => activeNote !== note);
  const fullyReleased = event.notes.every((target) => releasedTargetNotes.includes(target));

  if (!fullyReleased) {
    const nextState: GuidedStopWaitState = {
      ...state,
      phase: "waiting-for-release",
      activeNotes,
      releasedTargetNotes,
      feedback: "Release"
    };
    return { type: "progress", state: nextState, label: "Release" };
  }

  const completedEventIds = state.completedEventIds.includes(event.id)
    ? state.completedEventIds
    : [...state.completedEventIds, event.id];
  return {
    type: "completed",
    state: {
      ...state,
      phase: "success-confirmation",
      activeNotes: [],
      releasedTargetNotes,
      completedEventIds,
      confirmationUntil: timestampMs + confirmationMs,
      feedback: "Good"
    },
    label: "Good"
  };
};

export const pauseGuidedStopWait = (state: GuidedStopWaitState): GuidedStopWaitState => {
  if (state.phase !== "approaching") return state;
  return {
    ...state,
    phase: "manual-pause",
    manualPauseState: { returnPhase: state.phase },
    feedback: "Paused"
  };
};

export const resumeGuidedStopWait = (state: GuidedStopWaitState): GuidedStopWaitState => {
  if (state.phase !== "manual-pause") return state;
  return {
    ...state,
    phase: state.manualPauseState?.returnPhase ?? "approaching",
    manualPauseState: undefined,
    feedback: "Get ready"
  };
};

export const completeGuidedStopWait = (state: GuidedStopWaitState): GuidedStopWaitState => ({
  ...state,
  activeEventId: undefined,
  phase: "completed",
  activeNotes: [],
  requiredNotes: [],
  pressedTargetNotes: [],
  releasedTargetNotes: [],
  holdStartedAt: undefined,
  feedback: "Complete"
});

export const isGuidedStopWaitInputLocked = (phase: GuidedStopWaitPhase) =>
  phase === "waiting-for-input" ||
  phase === "collecting-chord" ||
  phase === "holding" ||
  phase === "waiting-for-release";

export const guidedStopWaitPrompt = (event?: TimedNoteEvent, state?: GuidedStopWaitState) => {
  if (state?.phase === "manual-pause") return "Paused";
  if (state?.phase === "success-confirmation") return state.feedback ?? "Good";
  if (state?.feedback) return state.feedback;
  return promptFor(event, state);
};
