import type { NoteId, TimedNoteEvent } from "../courseTypes";
import { millisecondsToBeat } from "./timelineMath";

export type GuidedStopWaitPhase =
  | "idle"
  | "approaching"
  | "waiting-for-input"
  | "collecting-chord"
  | "manual-pause"
  | "completed";

type PauseReturnPhase = Exclude<
  GuidedStopWaitPhase,
  "manual-pause" | "completed"
>;

export type GuidedStopWaitState = {
  activeEventId?: string;
  phase: GuidedStopWaitPhase;
  lockedBeat?: number;
  activeNotes: NoteId[];
  requiredNotes: NoteId[];
  pressedTargetNotes: NoteId[];
  blockedNotes: NoteId[];
  completedEventIds: string[];
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
  | { type: "completed"; state: GuidedStopWaitState; label: "Good" };

export type GuidedStopWaitApproachingPressResult =
  | { type: "ignored"; state: GuidedStopWaitState }
  | { type: "too-early"; state: GuidedStopWaitState }
  | { type: "ready"; state: GuidedStopWaitState };

type ResolveApproachingPressOptions = {
  state: GuidedStopWaitState;
  event: TimedNoteEvent;
  pressBeat: number;
  toleranceBeats: number;
};

const STOP_WAIT_APPROACH_TOLERANCE_MS = 80;

const uniqueNotes = (notes: NoteId[]) => [...new Set(notes)];

const noteList = (notes: NoteId[]) => notes.join(" and ");

const targetHeldNotes = (event: TimedNoteEvent, heldNotes: NoteId[]) =>
  event.notes.filter((note) => heldNotes.includes(note));

const promptFor = (event?: TimedNoteEvent, state?: GuidedStopWaitState) => {
  if (!event) return "Complete";
  if (event.notes.length > 1) {
    const pressed = new Set(state?.pressedTargetNotes ?? []);
    const blocked = new Set(state?.blockedNotes ?? []);
    const remaining = event.notes.filter(
      (note) => !pressed.has(note) || blocked.has(note),
    );
    return remaining.length && remaining.length < event.notes.length
      ? `Add ${noteList(remaining)}`
      : "Play the full chord";
  }
  return `Play ${event.notes[0]}`;
};

export const calculateStopWaitApproachToleranceBeats = (
  bpm: number,
  toleranceMs = STOP_WAIT_APPROACH_TOLERANCE_MS,
) => millisecondsToBeat(toleranceMs, bpm);

export const createGuidedStopWaitState = (
  events: TimedNoteEvent[],
): GuidedStopWaitState => {
  const [firstEvent] = events;

  return {
    activeEventId: firstEvent?.id,
    phase: firstEvent ? "idle" : "completed",
    activeNotes: [],
    requiredNotes: firstEvent?.notes ?? [],
    pressedTargetNotes: [],
    blockedNotes: [],
    completedEventIds: [],
    wrongNoteCount: 0,
    retryCountByEventId: {},
    feedback: firstEvent ? "Get ready" : "Complete",
  };
};

export const nextUncompletedEvent = (
  events: TimedNoteEvent[],
  completedEventIds: string[],
): TimedNoteEvent | undefined => {
  const completed = new Set(completedEventIds);
  return events.find((event) => !completed.has(event.id));
};

export const startGuidedStopWaitApproach = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent,
  heldNotes: NoteId[] = [],
): GuidedStopWaitState => ({
  ...state,
  activeEventId: event.id,
  phase: "approaching",
  lockedBeat: undefined,
  activeNotes: [],
  requiredNotes: event.notes,
  pressedTargetNotes: [],
  blockedNotes: targetHeldNotes(event, heldNotes),
  manualPauseState: undefined,
  feedback: event.notes.length > 1 ? "Get ready" : `Next: ${event.notes[0]}`,
});

export const lockGuidedStopWaitEvent = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent,
  heldNotes: NoteId[] = [],
): GuidedStopWaitState => ({
  ...state,
  activeEventId: event.id,
  phase: "waiting-for-input",
  lockedBeat: event.startBeat,
  activeNotes: [],
  requiredNotes: event.notes,
  pressedTargetNotes: [],
  blockedNotes: uniqueNotes([
    ...state.blockedNotes,
    ...targetHeldNotes(event, heldNotes),
  ]),
  feedback: promptFor(event, state),
});

export const resolveGuidedStopWaitApproachingPress = ({
  state,
  event,
  pressBeat,
  toleranceBeats,
}: ResolveApproachingPressOptions): GuidedStopWaitApproachingPressResult => {
  if (state.activeEventId !== event.id) return { type: "ignored", state };
  if (state.phase !== "approaching") return { type: "ignored", state };
  if (pressBeat + toleranceBeats < event.startBeat)
    return { type: "too-early", state };

  return { type: "ready", state: lockGuidedStopWaitEvent(state, event) };
};

export const applyGuidedStopWaitPress = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent,
  note: NoteId,
): GuidedStopWaitOutcome => {
  if (state.activeEventId !== event.id) return { type: "ignored", state };
  if (
    state.phase !== "waiting-for-input" &&
    state.phase !== "collecting-chord"
  ) {
    return { type: "ignored", state };
  }

  if (state.blockedNotes.includes(note)) {
    return { type: "ignored", state };
  }

  if (!event.notes.includes(note)) {
    const label =
      event.notes.length > 1
        ? "Wrong key - play the full chord"
        : `Wrong key - play ${event.notes[0]}`;
    return {
      type: "wrong",
      state: {
        ...state,
        wrongNoteCount: state.wrongNoteCount + 1,
        feedback: label,
      },
      label,
    };
  }

  const pressedTargetNotes = uniqueNotes([...state.pressedTargetNotes, note]);
  const activeNotes = uniqueNotes([...state.activeNotes, note]);
  const completeTarget = event.notes.every(
    (target) =>
      pressedTargetNotes.includes(target) && activeNotes.includes(target),
  );

  if (!completeTarget) {
    const nextState: GuidedStopWaitState = {
      ...state,
      phase: "collecting-chord",
      activeNotes,
      pressedTargetNotes,
      feedback: promptFor(event, { ...state, pressedTargetNotes }),
    };
    return {
      type: "progress",
      state: nextState,
      label: nextState.feedback ?? "Complete the chord",
    };
  }

  const completedEventIds = state.completedEventIds.includes(event.id)
    ? state.completedEventIds
    : [...state.completedEventIds, event.id];

  return {
    type: "completed",
    state: {
      ...state,
      activeNotes,
      pressedTargetNotes,
      completedEventIds,
      feedback: "Good",
    },
    label: "Good",
  };
};

export const applyGuidedStopWaitRelease = (
  state: GuidedStopWaitState,
  event: TimedNoteEvent,
  note: NoteId,
): GuidedStopWaitOutcome => {
  if (state.activeEventId !== event.id || !event.notes.includes(note)) {
    return { type: "ignored", state };
  }

  const blockedNotes = state.blockedNotes.filter(
    (blockedNote) => blockedNote !== note,
  );
  const activeNotes = state.activeNotes.filter(
    (activeNote) => activeNote !== note,
  );
  const pressedTargetNotes = state.pressedTargetNotes.filter(
    (pressedNote) => pressedNote !== note,
  );

  if (
    blockedNotes.length === state.blockedNotes.length &&
    activeNotes.length === state.activeNotes.length &&
    pressedTargetNotes.length === state.pressedTargetNotes.length
  ) {
    return { type: "ignored", state };
  }

  const nextState: GuidedStopWaitState = {
    ...state,
    phase:
      state.phase === "collecting-chord" && pressedTargetNotes.length
        ? "collecting-chord"
        : state.phase === "approaching"
          ? "approaching"
          : "waiting-for-input",
    blockedNotes,
    activeNotes,
    pressedTargetNotes,
    feedback:
      state.phase === "approaching"
        ? event.notes.length > 1
          ? "Get ready"
          : `Next: ${event.notes[0]}`
        : promptFor(event, { ...state, blockedNotes, pressedTargetNotes }),
  };

  return {
    type: "progress",
    state: nextState,
    label: nextState.feedback ?? "Play the full chord",
  };
};

export const pauseGuidedStopWait = (
  state: GuidedStopWaitState,
): GuidedStopWaitState => {
  if (state.phase !== "approaching") return state;
  return {
    ...state,
    phase: "manual-pause",
    manualPauseState: { returnPhase: state.phase },
    feedback: "Paused",
  };
};

export const resumeGuidedStopWait = (
  state: GuidedStopWaitState,
  heldNotes: NoteId[] = [],
): GuidedStopWaitState => {
  if (state.phase !== "manual-pause") return state;
  return {
    ...state,
    phase: state.manualPauseState?.returnPhase ?? "approaching",
    blockedNotes: uniqueNotes([
      ...state.blockedNotes,
      ...state.requiredNotes.filter((note) => heldNotes.includes(note)),
    ]),
    manualPauseState: undefined,
    feedback: "Get ready",
  };
};

export const completeGuidedStopWait = (
  state: GuidedStopWaitState,
): GuidedStopWaitState => ({
  ...state,
  activeEventId: undefined,
  phase: "completed",
  activeNotes: [],
  requiredNotes: [],
  pressedTargetNotes: [],
  blockedNotes: [],
  feedback: "Complete",
});

export const isGuidedStopWaitInputLocked = (phase: GuidedStopWaitPhase) =>
  phase === "waiting-for-input" || phase === "collecting-chord";

export const guidedStopWaitPrompt = (
  event?: TimedNoteEvent,
  state?: GuidedStopWaitState,
) => {
  if (state?.phase === "manual-pause") return "Paused";
  if (state?.feedback) return state.feedback;
  return promptFor(event, state);
};
