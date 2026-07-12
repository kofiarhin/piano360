import type { NoteId, TimedNoteEvent } from "../courseTypes";
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

export type TimingClassification = "perfect" | "good" | "accepted" | "missed" | "wrong";

export type TimingResult = {
  eventId: string;
  classification: TimingClassification;
  deltaMs: number;
  playedNotes: NoteId[];
};

type PendingChord = {
  eventId: string;
  playedNotes: NoteId[];
  timestampsMs: number[];
};

export type TimelineJudgeState = {
  judgedEventIds: string[];
  pendingChord?: PendingChord;
};

export const createTimelineJudgeState = (): TimelineJudgeState => ({ judgedEventIds: [] });

const classifyDelta = (deltaMs: number, windows: TimingWindows): TimingClassification => {
  const error = Math.abs(deltaMs);
  if (error <= windows.perfectMs) return "perfect";
  if (error <= windows.goodMs) return "good";
  return "accepted";
};

const candidateEvent = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  elapsedMs: number,
  bpm: number,
  acceptedMs: number
) => {
  const judged = new Set(state.judgedEventIds);
  return events
    .filter((event) => !judged.has(event.id))
    .map((event) => ({ event, deltaMs: elapsedMs - beatToMilliseconds(event.startBeat, bpm) }))
    .filter(({ deltaMs }) => Math.abs(deltaMs) <= acceptedMs)
    .sort((first, second) => Math.abs(first.deltaMs) - Math.abs(second.deltaMs))[0];
};

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
    : candidateEvent(state, events, elapsedMs, bpm, windows.acceptedMs);

  if (!candidate) {
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
        eventId: event.id,
        classification: classifyDelta(deltaMs, windows),
        deltaMs,
        playedNotes: [note]
      }
    };
  }

  const pending = state.pendingChord?.eventId === event.id ? state.pendingChord : undefined;
  const playedNotes = pending?.playedNotes.includes(note)
    ? (pending.playedNotes ?? [])
    : [...(pending?.playedNotes ?? []), note];
  const timestampsMs = pending?.playedNotes.includes(note)
    ? (pending.timestampsMs ?? [])
    : [...(pending?.timestampsMs ?? []), elapsedMs];
  const complete = event.notes.every((target) => playedNotes.includes(target));

  if (!complete) {
    return {
      state: {
        ...state,
        pendingChord: { eventId: event.id, playedNotes, timestampsMs }
      }
    };
  }

  const averageTimestamp =
    timestampsMs.reduce((sum, timestamp) => sum + timestamp, 0) / timestampsMs.length;
  const chordDeltaMs = averageTimestamp - beatToMilliseconds(event.startBeat, bpm);
  return {
    state: {
      judgedEventIds: [...state.judgedEventIds, event.id]
    },
    result: {
      eventId: event.id,
      classification: classifyDelta(chordDeltaMs, windows),
      deltaMs: chordDeltaMs,
      playedNotes
    }
  };
};

export const expireMissedEvents = (
  state: TimelineJudgeState,
  events: TimedNoteEvent[],
  elapsedMs: number,
  bpm: number,
  windows: TimingWindows = DEFAULT_TIMING_WINDOWS
): { state: TimelineJudgeState; results: TimingResult[] } => {
  const judged = new Set(state.judgedEventIds);
  const missed = events.filter(
    (event) =>
      !judged.has(event.id) &&
      elapsedMs > beatToMilliseconds(event.startBeat, bpm) + windows.acceptedMs
  );
  const results = missed.map((event) => ({
    eventId: event.id,
    classification: "missed" as const,
    deltaMs: elapsedMs - beatToMilliseconds(event.startBeat, bpm),
    playedNotes: []
  }));

  return {
    state: {
      judgedEventIds: [...state.judgedEventIds, ...missed.map((event) => event.id)],
      pendingChord: missed.some((event) => event.id === state.pendingChord?.eventId)
        ? undefined
        : state.pendingChord
    },
    results
  };
};
