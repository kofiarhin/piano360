import type { NoteId, TimedNoteEvent } from "../courseTypes";
import { scoreEventResult, type EventResult, type WrongTimingResult } from "./guidedPlayScoring";
import { beatToMilliseconds } from "./timelineMath";

export type TimingWindows = {
  perfectMs: number;
  goodMs: number;
  acceptedMs: number;
};

export const DEFAULT_TIMING_WINDOWS: TimingWindows = {
  perfectMs: 80,
  goodMs: 160,
  acceptedMs: 250
};

export type TimingClassification =
  | "perfect"
  | "good"
  | "early"
  | "late"
  | "partial"
  | "missed"
  | "wrong";

export type TimingResult = EventResult | WrongTimingResult;

type PendingChord = {
  eventId: string;
  playedNotes: NoteId[];
  attempts: Array<{ note: NoteId; deltaMs: number }>;
};

type PendingHold = {
  eventId: string;
  playedNotes: NoteId[];
  onsetDeltaMs: number;
  onsetClassification: Exclude<TimingClassification, "partial" | "missed" | "wrong">;
  pressElapsedMs: number;
};

export type TimelineJudgeState = {
  judgedEventIds: string[];
  pendingChord?: PendingChord;
  pendingHold?: PendingHold;
};

export const createTimelineJudgeState = (): TimelineJudgeState => ({ judgedEventIds: [] });

export type JudgeOutcome =
  | { type: "ignored"; state: TimelineJudgeState }
  | {
      type: "pending-chord";
      state: TimelineJudgeState;
      eventId: string;
      playedNotes: NoteId[];
      remainingNotes: NoteId[];
    }
  | {
      type: "holding";
      state: TimelineJudgeState;
      eventId: string;
      playedNotes: NoteId[];
      onsetDeltaMs: number;
    }
  | { type: "wrong"; state: TimelineJudgeState; result: WrongTimingResult }
  | { type: "scored"; state: TimelineJudgeState; result: EventResult };

const classifyDelta = (
  deltaMs: number,
  windows: TimingWindows
): Exclude<TimingClassification, "partial" | "missed" | "wrong"> => {
  const error = Math.abs(deltaMs);
  if (error <= windows.perfectMs) return "perfect";
  if (error <= windows.goodMs) return "good";
  return deltaMs < 0 ? "early" : "late";
};

const candidateEvent = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  note: NoteId,
  elapsedMs: number,
  bpm: number,
  acceptedMs: number
) => {
  const judged = new Set(state.judgedEventIds);
  return events
    .filter((event) => !judged.has(event.id))
    .map((event) => ({ event, deltaMs: elapsedMs - beatToMilliseconds(event.startBeat, bpm) }))
    .filter(({ deltaMs }) => Math.abs(deltaMs) <= acceptedMs)
    .sort((first, second) => {
      const firstContains = first.event.notes.includes(note);
      const secondContains = second.event.notes.includes(note);
      if (firstContains !== secondContains) return firstContains ? -1 : 1;
      const deltaDifference = Math.abs(first.deltaMs) - Math.abs(second.deltaMs);
      if (deltaDifference !== 0) return deltaDifference;
      return first.event.startBeat - second.event.startBeat;
    })[0];
};

const leastAccurateAttempt = (attempts: Array<{ note: NoteId; deltaMs: number }>) =>
  attempts.reduce((least, attempt) =>
    Math.abs(attempt.deltaMs) >= Math.abs(least.deltaMs) ? attempt : least
  );

const durationReleaseToleranceMs = (event: TimedNoteEvent, bpm: number, windows: TimingWindows) => {
  const durationMs = beatToMilliseconds(event.durationBeats, bpm);
  return Math.min(windows.acceptedMs, durationMs * 0.35);
};

const minimumHoldMilliseconds = (event: TimedNoteEvent, bpm: number, windows: TimingWindows) => {
  const durationMs = beatToMilliseconds(event.durationBeats, bpm);
  return Math.max(0, durationMs - durationReleaseToleranceMs(event, bpm, windows));
};

export const judgeTimelineInput = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  note: NoteId,
  elapsedMs: number,
  bpm: number,
  windows: TimingWindows = DEFAULT_TIMING_WINDOWS
): JudgeOutcome => {
  if (state.pendingHold) return { type: "ignored", state };

  const pendingEvent = state.pendingChord
    ? events.find((event) => event.id === state.pendingChord?.eventId)
    : undefined;
  const candidate = pendingEvent
    ? { event: pendingEvent, deltaMs: elapsedMs - beatToMilliseconds(pendingEvent.startBeat, bpm) }
    : candidateEvent(state, events, note, elapsedMs, bpm, windows.acceptedMs);

  if (!candidate || Math.abs(candidate.deltaMs) > windows.acceptedMs) {
    return { type: "ignored", state };
  }

  const { event, deltaMs } = candidate;
  if (!event.notes.includes(note)) {
    return {
      type: "wrong",
      state,
      result: { eventId: event.id, classification: "wrong", deltaMs, playedNotes: [note] }
    };
  }

  if (event.notes.length === 1) {
    const onsetClassification = classifyDelta(deltaMs, windows);
    return {
      type: "holding",
      state: {
        ...state,
        pendingChord: undefined,
        pendingHold: {
          eventId: event.id,
          playedNotes: [note],
          onsetDeltaMs: deltaMs,
          onsetClassification,
          pressElapsedMs: elapsedMs
        }
      },
      eventId: event.id,
      playedNotes: [note],
      onsetDeltaMs: deltaMs
    };
  }

  const pending = state.pendingChord?.eventId === event.id ? state.pendingChord : undefined;
  const existingPlayedNotes = pending?.playedNotes ?? [];
  const existingAttempts = pending?.attempts ?? [];
  const alreadyPlayed = existingPlayedNotes.includes(note);
  const playedNotes = alreadyPlayed ? existingPlayedNotes : [...existingPlayedNotes, note];
  const attempts = alreadyPlayed ? existingAttempts : [...existingAttempts, { note, deltaMs }];
  const complete = event.notes.every((target) => playedNotes.includes(target));

  if (!complete) {
    return {
      type: "pending-chord",
      state: { ...state, pendingChord: { eventId: event.id, playedNotes, attempts } },
      eventId: event.id,
      playedNotes,
      remainingNotes: event.notes.filter((target) => !playedNotes.includes(target))
    };
  }

  const chordAttempt = leastAccurateAttempt(attempts);
  const onsetClassification = classifyDelta(chordAttempt.deltaMs, windows);
  return {
    type: "holding",
    state: {
      ...state,
      pendingChord: undefined,
      pendingHold: {
        eventId: event.id,
        playedNotes,
        onsetDeltaMs: chordAttempt.deltaMs,
        onsetClassification,
        pressElapsedMs: elapsedMs
      }
    },
    eventId: event.id,
    playedNotes,
    onsetDeltaMs: chordAttempt.deltaMs
  };
};

export const judgeTimelineRelease = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  note: NoteId,
  elapsedMs: number,
  bpm: number,
  windows: TimingWindows = DEFAULT_TIMING_WINDOWS
): JudgeOutcome => {
  if (state.pendingChord?.playedNotes.includes(note)) {
    const playedNotes = state.pendingChord.playedNotes.filter((playedNote) => playedNote !== note);
    const attempts = state.pendingChord.attempts.filter((attempt) => attempt.note !== note);
    return {
      type: "ignored",
      state: {
        ...state,
        pendingChord: playedNotes.length
          ? { ...state.pendingChord, playedNotes, attempts }
          : undefined
      }
    };
  }

  const pendingHold = state.pendingHold;
  if (!pendingHold || !pendingHold.playedNotes.includes(note)) {
    return { type: "ignored", state };
  }

  const event = events.find((item) => item.id === pendingHold.eventId);
  if (!event) return { type: "ignored", state: { ...state, pendingHold: undefined } };

  const eventEndMs = beatToMilliseconds(event.startBeat + event.durationBeats, bpm);
  const releaseDeltaMs = elapsedMs - eventEndMs;
  const heldMs = elapsedMs - pendingHold.pressElapsedMs;
  const heldLongEnough = heldMs >= minimumHoldMilliseconds(event, bpm, windows);
  const releasedNearEnd = Math.abs(releaseDeltaMs) <= windows.acceptedMs;
  const classification =
    heldLongEnough && releasedNearEnd ? pendingHold.onsetClassification : "partial";

  return {
    type: "scored",
    state: {
      judgedEventIds: [...state.judgedEventIds, event.id],
      pendingChord: undefined,
      pendingHold: undefined
    },
    result: scoreEventResult({
      eventId: event.id,
      classification,
      deltaMs: pendingHold.onsetDeltaMs,
      playedNotes: pendingHold.playedNotes
    })
  };
};

export type ExpireMissedEventsOptions = {
  stopAfterFirstFailure?: boolean;
};

export const expireMissedEvents = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  elapsedMs: number,
  bpm: number,
  windows: TimingWindows = DEFAULT_TIMING_WINDOWS,
  options: ExpireMissedEventsOptions = {}
): { state: TimelineJudgeState; results: EventResult[] } => {
  const judged = new Set(state.judgedEventIds);
  const pendingEventId = state.pendingChord?.eventId;
  const pendingHoldEventId = state.pendingHold?.eventId;
  const overdue = events.filter(
    (event) =>
      !judged.has(event.id) &&
      event.id !== pendingEventId &&
      event.id !== pendingHoldEventId &&
      elapsedMs > beatToMilliseconds(event.startBeat, bpm) + windows.acceptedMs
  );
  const missed = options.stopAfterFirstFailure ? overdue.slice(0, 1) : overdue;
  const results: EventResult[] = missed.map((event) =>
    scoreEventResult({
      eventId: event.id,
      classification: "missed",
      deltaMs: elapsedMs - beatToMilliseconds(event.startBeat, bpm),
      playedNotes: []
    })
  );

  const canProcessPendingFailure = !options.stopAfterFirstFailure || results.length === 0;
  const pendingEvent = state.pendingChord
    ? events.find((event) => event.id === state.pendingChord?.eventId)
    : undefined;
  const pendingExpired =
    canProcessPendingFailure &&
    pendingEvent !== undefined &&
    elapsedMs > beatToMilliseconds(pendingEvent.startBeat, bpm) + windows.acceptedMs;
  const partialResult =
    pendingEvent && pendingExpired
      ? scoreEventResult({
          eventId: pendingEvent.id,
          classification: state.pendingChord?.playedNotes.length ? "partial" : "missed",
          deltaMs: elapsedMs - beatToMilliseconds(pendingEvent.startBeat, bpm),
          playedNotes: state.pendingChord?.playedNotes ?? []
        })
      : undefined;

  const pendingHoldEvent = state.pendingHold
    ? events.find((event) => event.id === state.pendingHold?.eventId)
    : undefined;
  const pendingHoldExpired =
    canProcessPendingFailure &&
    !partialResult &&
    pendingHoldEvent !== undefined &&
    elapsedMs >
      beatToMilliseconds(pendingHoldEvent.startBeat + pendingHoldEvent.durationBeats, bpm) +
        windows.acceptedMs;
  const pendingHoldResult =
    pendingHoldEvent && pendingHoldExpired
      ? scoreEventResult({
          eventId: pendingHoldEvent.id,
          classification: "partial",
          deltaMs: state.pendingHold?.onsetDeltaMs ?? 0,
          playedNotes: state.pendingHold?.playedNotes ?? []
        })
      : undefined;

  if (partialResult) results.push(partialResult);
  if (pendingHoldResult) results.push(pendingHoldResult);

  return {
    state: {
      judgedEventIds: [
        ...state.judgedEventIds,
        ...missed.map((event) => event.id),
        ...(partialResult ? [partialResult.eventId] : []),
        ...(pendingHoldResult ? [pendingHoldResult.eventId] : [])
      ],
      pendingChord: partialResult ? undefined : state.pendingChord,
      pendingHold: pendingHoldResult ? undefined : state.pendingHold
    },
    results
  };
};
