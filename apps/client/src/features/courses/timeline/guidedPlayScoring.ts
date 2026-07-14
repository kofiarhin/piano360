import type { NoteId, TimedNoteEvent } from "../courseTypes";
import type { TimingClassification } from "./timingJudge";

export const SCORE_VALUES = {
  perfect: 100,
  good: 70,
  early: 40,
  late: 40,
  partial: 20,
  missed: 0
} as const;

export type ScoredTimingClassification = keyof typeof SCORE_VALUES;

export type EventResult = {
  eventId: string;
  classification: ScoredTimingClassification;
  deltaMs: number;
  playedNotes: NoteId[];
  points: number;
};

export type WrongTimingResult = {
  eventId?: string;
  classification: "wrong";
  deltaMs: number;
  playedNotes: NoteId[];
};

export type TimingFeedback = {
  classification: TimingClassification;
  deltaMs?: number;
  label: string;
};

export type GuidedPlaySummary = {
  score: number;
  maxPossibleScore: number;
  scorePercent: number;
  maxCombo: number;
  fullyCorrectInputs: number;
  incorrectInputs: number;
  eventAccuracy: number;
  perfectInputs: number;
  goodInputs: number;
  earlyInputs: number;
  lateInputs: number;
  partialInputs: number;
  missedInputs: number;
  wrongInputs: number;
  meanAbsoluteTimingErrorMs: number;
  durationMs: number;
  restartCount: number;
};

export const pointsForClassification = (classification: ScoredTimingClassification) =>
  SCORE_VALUES[classification];

export const scoreEventResult = (result: Omit<EventResult, "points">): EventResult => ({
  ...result,
  points: pointsForClassification(result.classification)
});

export const resultAffectsCombo = (classification: ScoredTimingClassification) =>
  classification === "perfect" || classification === "good";

export const maxPossibleScoreForEvents = (events: TimedNoteEvent[]) =>
  events.length * SCORE_VALUES.perfect;
