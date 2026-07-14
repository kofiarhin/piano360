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

export type TimelineJudgeState = {
  judgedEventIds: string[];
  pendingChord?: PendingChord;
};

export const createTimelineJudgeState = (): TimelineJudgeState => ({ judgedEventIds: [] });

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
      if (firstContains !== secondContains) {
        return firstContains ? -1 : 1;
      }

      const deltaDifference = Math.abs(first.deltaMs) - Math.abs(second.deltaMs);
      if (deltaDifference !== 0) {
        return deltaDifference;
      }

      return first.event.startBeat - second.event.startBeat;
    })[0];
};

const leastAccurateAttempt = (attempts: Array<{ note: NoteId; deltaMs: number }>) =>
  attempts.reduce((least, attempt) => {
    const leastError = Math.abs(least.deltaMs);
    const nextError = Math.abs(attempt.deltaMs);
    return nextError >= leastError ? attempt : least;
  });

export const judgeTimelineInput = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  note: NoteId,
  elapsedMs: number,
  bpm: number,
  windows: TimingWindows = DEFAULT_TIMING_WINDOWS
): { state: TimelineJudgeState; result?: TimingResult } => {
  const pendingEvent = state.pendingChord
    ? events.find((event) => event.id === state.pendingChord?.eventId)
    : undefined;
  const candidate = pendingEvent
    ? {
        event: pendingEvent,
        deltaMs: elapsedMs - beatToMilliseconds(pendingEvent.startBeat, bpm)
      }
    : candidateEvent(state, events, note, elapsedMs, bpm, windows.acceptedMs);

  if (!candidate || Math.abs(candidate.deltaMs) > windows.acceptedMs) {
    return { state };
  }

  const { event, deltaMs } = candidate;
  if (!event.notes.includes(note)) {
    return {
      state,
      result: { eventId: event.id, classification: "wrong", deltaMs, playedNotes: [note] }
    };
  }

  if (event.notes.length === 1) {
    return {
      state: {
        ...state,
        judgedEventIds: [...state.judgedEventIds, event.id],
        pendingChord: undefined
      },
      result: {
        ...scoreEventResult({
        eventId: event.id,
        classification: classifyDelta(deltaMs, windows),
        deltaMs,
        playedNotes: [note]
        })
      }
    };
  }

  const pending = state.pendingChord?.eventId === event.id ? state.pendingChord : undefined;
  const existingPlayedNotes = pending?.playedNotes ?? [];
  const existingAttempts = pending?.attempts ?? [];
  const alreadyPlayed = existingPlayedNotes.includes(note);
  const playedNotes = alreadyPlayed ? existingPlayedNotes : [...existingPlayedNotes, note];
  const attempts = alreadyPlayed
    ? existingAttempts
    : [...existingAttempts, { note, deltaMs }];
  const complete = event.notes.every((target) => playedNotes.includes(target));

  if (!complete) {
    return {
      state: {
        ...state,
        pendingChord: { eventId: event.id, playedNotes, attempts }
      }
    };
  }

  const chordAttempt = leastAccurateAttempt(attempts);
  return {
    state: {
      judgedEventIds: [...state.judgedEventIds, event.id]
    },
    result: {
      ...scoreEventResult({
      eventId: event.id,
      classification: classifyDelta(chordAttempt.deltaMs, windows),
      deltaMs: chordAttempt.deltaMs,
      playedNotes
      })
    }
  };
};

export const expireMissedEvents = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  elapsedMs: number,
  bpm: number,
  windows: TimingWindows = DEFAULT_TIMING_WINDOWS
): { state: TimelineJudgeState; results: EventResult[] } => {
  const judged = new Set(state.judgedEventIds);
  const pendingEventId = state.pendingChord?.eventId;
  const missed = events.filter(
    (event) =>
      !judged.has(event.id) &&
      event.id !== pendingEventId &&
      elapsedMs > beatToMilliseconds(event.startBeat, bpm) + windows.acceptedMs
  );
  const results: EventResult[] = missed.map((event) =>
    scoreEventResult({
    eventId: event.id,
    classification: "missed",
    deltaMs: elapsedMs - beatToMilliseconds(event.startBeat, bpm),
    playedNotes: []
    })
  );
  const pendingEvent = state.pendingChord
    ? events.find((event) => event.id === state.pendingChord?.eventId)
    : undefined;
  const pendingExpired =
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
  if (partialResult) {
    results.push(partialResult);
  }

  return {
    state: {
      judgedEventIds: [
        ...state.judgedEventIds,
        ...missed.map((event) => event.id),
        ...(partialResult ? [partialResult.eventId] : [])
      ],
      pendingChord: partialResult ? undefined : state.pendingChord
    },
    results
  };
};
