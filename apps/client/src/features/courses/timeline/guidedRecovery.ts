import type { NoteId, TimedNoteEvent } from "../courseTypes";
import { beatToMilliseconds } from "./timelineMath";
import type { TimingWindows } from "./timingJudge";

export type GuidedRecoveryPhase = "waiting" | "collecting-chord" | "holding" | "releasing";

export type GuidedRecoveryState = {
  eventId: string;
  phase: GuidedRecoveryPhase;
  pressedNotes: NoteId[];
  releasedNotes: NoteId[];
  holdStartedAtMs?: number;
};

export type GuidedRecoveryOutcome =
  | { type: "ignored"; state: GuidedRecoveryState }
  | { type: "wrong"; state: GuidedRecoveryState }
  | { type: "progress"; state: GuidedRecoveryState; label: "Complete the chord" | "Hold" | "Release" }
  | { type: "retry"; state: GuidedRecoveryState; label: "Hold longer" }
  | { type: "completed"; state: GuidedRecoveryState };

export const createGuidedRecoveryState = (eventId: string): GuidedRecoveryState => ({
  eventId,
  phase: "waiting",
  pressedNotes: [],
  releasedNotes: []
});

const uniqueNotes = (notes: NoteId[]) => [...new Set(notes)];

const minimumRecoveryHoldMilliseconds = (
  event: TimedNoteEvent,
  bpm: number,
  windows: TimingWindows
) => {
  const durationMs = beatToMilliseconds(event.durationBeats, bpm);
  const toleranceMs = Math.min(windows.acceptedMs, durationMs * 0.35);
  return Math.max(0, durationMs - toleranceMs);
};

const resetRecoveryAttempt = (eventId: string): GuidedRecoveryState =>
  createGuidedRecoveryState(eventId);

export const applyGuidedRecoveryPress = (
  state: GuidedRecoveryState,
  event: TimedNoteEvent,
  note: NoteId,
  elapsedMs: number
): GuidedRecoveryOutcome => {
  if (state.eventId !== event.id || !event.notes.includes(note)) {
    return { type: "wrong", state };
  }

  if (state.phase === "holding" || state.phase === "releasing") {
    return { type: "ignored", state };
  }

  const pressedNotes = uniqueNotes([...state.pressedNotes, note]);
  const completeChord = event.notes.every((target) => pressedNotes.includes(target));

  if (!completeChord) {
    return {
      type: "progress",
      state: {
        ...state,
        phase: "collecting-chord",
        pressedNotes
      },
      label: "Complete the chord"
    };
  }

  return {
    type: "progress",
    state: {
      ...state,
      phase: "holding",
      pressedNotes,
      releasedNotes: [],
      holdStartedAtMs: elapsedMs
    },
    label: "Hold"
  };
};

export const applyGuidedRecoveryRelease = (
  state: GuidedRecoveryState,
  event: TimedNoteEvent,
  note: NoteId,
  elapsedMs: number,
  bpm: number,
  windows: TimingWindows
): GuidedRecoveryOutcome => {
  if (state.eventId !== event.id || !event.notes.includes(note)) {
    return { type: "ignored", state };
  }

  if (state.phase === "collecting-chord") {
    return {
      type: "ignored",
      state: {
        ...state,
        pressedNotes: state.pressedNotes.filter((pressed) => pressed !== note)
      }
    };
  }

  if (state.phase !== "holding" && state.phase !== "releasing") {
    return { type: "ignored", state };
  }

  const holdStartedAtMs = state.holdStartedAtMs ?? elapsedMs;
  const heldMs = elapsedMs - holdStartedAtMs;
  const heldLongEnough = heldMs >= minimumRecoveryHoldMilliseconds(event, bpm, windows);

  if (!heldLongEnough) {
    return {
      type: "retry",
      state: resetRecoveryAttempt(event.id),
      label: "Hold longer"
    };
  }

  const releasedNotes = uniqueNotes([...state.releasedNotes, note]);
  const fullyReleased = event.notes.every((target) => releasedNotes.includes(target));

  if (!fullyReleased) {
    return {
      type: "progress",
      state: {
        ...state,
        phase: "releasing",
        releasedNotes
      },
      label: "Release"
    };
  }

  return {
    type: "completed",
    state: {
      ...state,
      phase: "releasing",
      releasedNotes
    }
  };
};
