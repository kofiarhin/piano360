import type { TimedNoteEvent } from "../courseTypes";
import {
  maxPossibleScoreForEvents,
  resultAffectsCombo,
  type EventResult,
  type GuidedPlaySummary,
  type TimingFeedback
} from "./guidedPlayScoring";
import type { TimelineJudgeState } from "./timingJudge";

export type GuidedPlayPhase = "idle" | "count-in" | "playing" | "paused" | "completed";

export type GuidedPlayState = {
  phase: GuidedPlayPhase;
  score: number;
  combo: number;
  maxCombo: number;
  resultsByEventId: Record<string, EventResult>;
  feedback?: TimingFeedback;
  wrongInputCount: number;
  restartCount: number;
};

export type GuidedPlayAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" }
  | { type: "complete" }
  | { type: "event-result"; result: EventResult }
  | { type: "wrong-input"; feedback: TimingFeedback }
  | { type: "feedback"; feedback?: TimingFeedback };

export const createGuidedPlayState = (): GuidedPlayState => ({
  phase: "idle",
  score: 0,
  combo: 0,
  maxCombo: 0,
  resultsByEventId: {},
  wrongInputCount: 0,
  restartCount: 0
});

export const guidedPlayReducer = (
  state: GuidedPlayState,
  action: GuidedPlayAction
): GuidedPlayState => {
  switch (action.type) {
    case "play":
      return { ...state, phase: "count-in" };
    case "pause":
      return state.phase === "completed" ? state : { ...state, phase: "paused" };
    case "resume":
      return state.phase === "completed" ? state : { ...state, phase: "playing" };
    case "restart":
      return { ...createGuidedPlayState(), restartCount: state.restartCount + 1 };
    case "complete":
      return { ...state, phase: "completed", combo: 0 };
    case "event-result": {
      if (state.resultsByEventId[action.result.eventId]) {
        return state;
      }

      const nextCombo = resultAffectsCombo(action.result.classification) ? state.combo + 1 : 0;
      return {
        ...state,
        score: state.score + action.result.points,
        combo: nextCombo,
        maxCombo: Math.max(state.maxCombo, nextCombo),
        resultsByEventId: {
          ...state.resultsByEventId,
          [action.result.eventId]: action.result
        },
        feedback: {
          classification: action.result.classification,
          deltaMs: action.result.deltaMs,
          label: action.result.classification
        }
      };
    }
    case "wrong-input":
      return {
        ...state,
        wrongInputCount: state.wrongInputCount + 1,
        feedback: action.feedback
      };
    case "feedback":
      return { ...state, feedback: action.feedback };
    default:
      return state;
  }
};

export const isGuidedPlayCompletionEligible = ({
  events,
  judgeState,
  currentBeat,
  totalBeats
}: {
  events: TimedNoteEvent[];
  judgeState: TimelineJudgeState;
  currentBeat: number;
  totalBeats: number;
}) => {
  if (judgeState.pendingChord) {
    return false;
  }

  if (currentBeat < totalBeats) {
    return false;
  }

  const judgedEventIds = new Set(judgeState.judgedEventIds);
  return events.every((event) => judgedEventIds.has(event.id));
};

export const summarizeGuidedPlay = (
  state: GuidedPlayState,
  events: TimedNoteEvent[],
  durationMs: number
): GuidedPlaySummary => {
  const results = Object.values(state.resultsByEventId);
  const maxPossibleScore = maxPossibleScoreForEvents(events);
  const timedResults = results.filter((result) => result.classification !== "missed");
  const perfectInputs = results.filter((result) => result.classification === "perfect").length;
  const goodInputs = results.filter((result) => result.classification === "good").length;
  const earlyInputs = results.filter((result) => result.classification === "early").length;
  const lateInputs = results.filter((result) => result.classification === "late").length;
  const partialInputs = results.filter((result) => result.classification === "partial").length;
  const missedInputs = results.filter((result) => result.classification === "missed").length;
  const fullyCorrectInputs = perfectInputs + goodInputs + earlyInputs + lateInputs;
  const incorrectInputs = partialInputs + missedInputs;
  const meanAbsoluteTimingErrorMs = timedResults.length
    ? timedResults.reduce((sum, result) => sum + Math.abs(result.deltaMs), 0) / timedResults.length
    : 0;

  return {
    score: state.score,
    maxPossibleScore,
    scorePercent: maxPossibleScore ? state.score / maxPossibleScore : 0,
    maxCombo: state.maxCombo,
    fullyCorrectInputs,
    incorrectInputs,
    eventAccuracy: events.length ? fullyCorrectInputs / events.length : 0,
    perfectInputs,
    goodInputs,
    earlyInputs,
    lateInputs,
    partialInputs,
    missedInputs,
    wrongInputs: state.wrongInputCount,
    meanAbsoluteTimingErrorMs,
    durationMs,
    restartCount: state.restartCount
  };
};
