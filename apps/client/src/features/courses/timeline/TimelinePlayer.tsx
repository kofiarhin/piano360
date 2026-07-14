import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { playNote, warmAudio } from "../../../audio/NotePlayer";
import { MobileLandscapeShell, useMobileLandscapeMode } from "../../../shared/MobileLandscapeShell";
import { SiteHeader } from "../../../shared/SiteHeader";
import { CoursePiano } from "../CoursePiano";
import type { LessonDetail, NoteId, TimedNoteEvent } from "../courseTypes";
import { formatDuration } from "../formatMetrics";
import { loadProgress, recordLessonCompletion } from "../progressStorage";
import { FallingNotesStage } from "./FallingNotesStage";
import { LOOK_AHEAD_BEATS } from "./fallingNotesLayout";
import {
  applyGuidedRecoveryPress,
  applyGuidedRecoveryRelease,
  createGuidedRecoveryState,
  type GuidedRecoveryState
} from "./guidedRecovery";
import {
  createGuidedPlayState,
  guidedPlayReducer,
  isGuidedPlayCompletionEligible,
  summarizeGuidedPlay
} from "./guidedPlayReducer";
import type { EventResult, GuidedPlaySummary, TimingFeedback } from "./guidedPlayScoring";
import type { NoteAttempt } from "./noteInput";
import type { ResolvedGuidedTimeline } from "./resolveGuidedTimeline";
import { TempoControl } from "./TempoControl";
import { loadTempoPercent, saveTempoPercent } from "./tempoStorage";
import { beatToMilliseconds, tempoFromPercent } from "./timelineMath";
import {
  createTimelineJudgeState,
  DEFAULT_TIMING_WINDOWS,
  expireMissedEvents,
  judgeTimelineInput,
  judgeTimelineRelease,
  type TimelineJudgeState,
  type TimingClassification
} from "./timingJudge";
import { usePianoKeyGeometry } from "./usePianoKeyGeometry";
import { useTimelineInput } from "./useTimelineInput";
import { useTimelineTransport } from "./useTimelineTransport";

type TimelinePlayerProps = {
  lesson: LessonDetail;
  timeline: ResolvedGuidedTimeline;
  nextLessonSlug?: string;
  onProgressSaved: () => void;
};

const RECOVERY_CONFIRMATION_MS = 320;

const feedbackLabel = (feedback?: TimingFeedback) => {
  if (!feedback) return "Ready";
  if (
    feedback.label === "Complete the chord" ||
    feedback.label === "Hold" ||
    feedback.label === "Hold longer" ||
    feedback.label === "Release" ||
    feedback.label === "Recovered"
  ) {
    return feedback.label;
  }
  if (feedback.classification === "wrong") return "Wrong note";
  if (feedback.classification === "partial") return "Partial target";
  if (feedback.classification === "missed") return "Missed";
  const delta = feedback.deltaMs ?? 0;
  const label = feedback.classification[0].toUpperCase() + feedback.classification.slice(1);
  return `${label} ${delta >= 0 ? "+" : ""}${Math.round(delta)} ms`;
};

const progressSummaryToLegacyCompletion = (
  summary: GuidedPlaySummary,
  totalEvents: number,
  lesson: LessonDetail
) => {
  const correctInputs = summary.fullyCorrectInputs;

  return {
    courseSlug: lesson.courseSlug,
    lessonSlug: lesson.slug,
    completedAt: new Date().toISOString(),
    correctInputs,
    incorrectInputs: summary.incorrectInputs,
    accuracy: totalEvents ? summary.eventAccuracy : 0,
    durationMs: summary.durationMs,
    restartCount: summary.restartCount,
    score: summary.score,
    maxPossibleScore: summary.maxPossibleScore,
    scorePercent: summary.scorePercent,
    maxCombo: summary.maxCombo,
    fullyCorrectInputs: summary.fullyCorrectInputs,
    eventAccuracy: summary.eventAccuracy,
    perfectInputs: summary.perfectInputs,
    goodInputs: summary.goodInputs,
    earlyInputs: summary.earlyInputs,
    lateInputs: summary.lateInputs,
    partialInputs: summary.partialInputs,
    missedInputs: summary.missedInputs,
    wrongInputs: summary.wrongInputs,
    meanAbsoluteTimingErrorMs: summary.meanAbsoluteTimingErrorMs,
    rhythmicAccuracy: summary.scorePercent
  };
};

const scoreableResults = (resultsByEventId: Record<string, EventResult>) =>
  Object.fromEntries(
    Object.entries(resultsByEventId).map(([eventId, result]) => [
      eventId,
      result.classification as TimingClassification
    ])
  );

const timingSourceLabel = (timeline: ResolvedGuidedTimeline) =>
  timeline.timingSource === "verified" ? "Verified rhythm" : "Instructional timing";

const recoveryPrompt = (event?: TimedNoteEvent, recovery?: GuidedRecoveryState) => {
  if (!event) return "Waiting for you";
  if (recovery?.phase === "holding") return "Hold";
  if (recovery?.phase === "releasing") return "Release";
  if (event.notes.length > 1) {
    return recovery?.phase === "collecting-chord" ? "Complete the chord" : "Play the full chord";
  }
  return `Play ${event.notes[0]}`;
};

export const TimelinePlayer = ({
  lesson,
  timeline,
  nextLessonSlug,
  onProgressSaved
}: TimelinePlayerProps) => {
  const mobileLandscapeActive = useMobileLandscapeMode();
  const stageRef = useRef<HTMLElement | null>(null);
  const pianoRef = useRef<HTMLElement | null>(null);
  const geometry = usePianoKeyGeometry(pianoRef, stageRef);
  const noteEvents = useMemo(() => timeline.events, [timeline.events]);
  const [tempoPercent, setTempoPercent] = useState(() =>
    loadTempoPercent(lesson.courseSlug, lesson.slug)
  );
  const initialBpm = tempoFromPercent(timeline.originalBpm, tempoPercent);
  const transport = useTimelineTransport({
    bpm: initialBpm,
    totalBeats: timeline.totalBeats,
    countInBeats: timeline.countInBeats
  });
  const [state, dispatch] = useReducer(guidedPlayReducer, undefined, createGuidedPlayState);
  const judgeStateRef = useRef<TimelineJudgeState>(createTimelineJudgeState());
  const savedCompletionRef = useRef(false);
  const recoveryTimerRef = useRef<number | undefined>(undefined);
  const [activeNotes, setActiveNotes] = useState<NoteId[]>([]);
  const [recoveryState, setRecoveryState] = useState<GuidedRecoveryState>();
  const recoveryEnabled = lesson.behaviour?.pauseOnMiss ?? true;

  const nextUnjudgedEvent = useMemo(() => {
    const judged = new Set(judgeStateRef.current.judgedEventIds);
    return noteEvents.find((event) => !judged.has(event.id));
  }, [noteEvents, state.resultsByEventId, state.recoveredEventIds]);

  const recoveryEvent = recoveryState
    ? noteEvents.find((event) => event.id === recoveryState.eventId)
    : undefined;
  const activeTargetEvent = recoveryEvent ?? nextUnjudgedEvent;
  const targetNotes = activeTargetEvent?.notes ?? [];
  const summary = summarizeGuidedPlay(
    state,
    noteEvents,
    beatToMilliseconds(timeline.totalBeats, transport.selectedBpm)
  );
  const completed = state.phase === "completed";
  const recoveryLocked = state.phase === "recovery" && recoveryState !== undefined;

  const applyResults = useCallback((results: EventResult[]) => {
    for (const result of results) {
      dispatch({ type: "event-result", result });
    }
  }, []);

  const beginRecovery = useCallback(
    (eventId: string, label?: string) => {
      if (!recoveryEnabled) return;
      const event = noteEvents.find((item) => item.id === eventId);
      if (!event) return;
      transport.pause();
      transport.seek(event.startBeat);
      setRecoveryState(createGuidedRecoveryState(event.id));
      dispatch({
        type: "recovery-start",
        feedback: {
          classification: "missed",
          label: label ?? (event.notes.length > 1 ? "Play the full chord" : `Play ${event.notes[0]}`)
        }
      });
    },
    [noteEvents, recoveryEnabled, transport]
  );

  const finishRecovery = useCallback(
    (eventId: string) => {
      dispatch({ type: "recovery-complete", eventId });
      if (recoveryTimerRef.current !== undefined) {
        window.clearTimeout(recoveryTimerRef.current);
      }
      recoveryTimerRef.current = window.setTimeout(() => {
        setRecoveryState(undefined);
        dispatch({ type: "recovery-confirmation-end" });
        const judged = new Set(judgeStateRef.current.judgedEventIds);
        const nextEvent = noteEvents.find((event) => !judged.has(event.id));
        if (nextEvent) {
          transport.seek(Math.max(0, nextEvent.startBeat - LOOK_AHEAD_BEATS));
          transport.play();
        } else {
          transport.seek(timeline.totalBeats);
        }
      }, RECOVERY_CONFIRMATION_MS);
    },
    [noteEvents, timeline.totalBeats, transport]
  );

  useEffect(
    () => () => {
      if (recoveryTimerRef.current !== undefined) {
        window.clearTimeout(recoveryTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (transport.isPlaying && transport.currentBeat >= 0 && !recoveryState) {
      const expired = expireMissedEvents(
        judgeStateRef.current,
        noteEvents,
        beatToMilliseconds(transport.currentBeat, transport.selectedBpm),
        transport.selectedBpm,
        DEFAULT_TIMING_WINDOWS,
        { stopAfterFirstFailure: recoveryEnabled }
      );

      if (expired.results.length) {
        judgeStateRef.current = expired.state;
        applyResults(expired.results);
        const failed = expired.results[0];
        if (
          recoveryEnabled &&
          failed &&
          (failed.classification === "missed" || failed.classification === "partial")
        ) {
          beginRecovery(failed.eventId, failed.classification === "partial" ? "Hold longer" : undefined);
          return;
        }
      }
    }

    if (recoveryState || state.phase === "recovery-confirmation") return;

    const completionEligible = isGuidedPlayCompletionEligible({
      events: noteEvents,
      judgeState: judgeStateRef.current,
      currentBeat: transport.currentBeat,
      totalBeats: timeline.totalBeats
    });
    if (state.phase !== "completed" && completionEligible) {
      transport.pause();
      dispatch({ type: "complete" });
    }
  }, [
    applyResults,
    beginRecovery,
    noteEvents,
    recoveryEnabled,
    recoveryState,
    state.phase,
    timeline.totalBeats,
    transport
  ]);

  const play = useCallback(() => {
    if (recoveryState || state.phase === "recovery-confirmation") return;
    warmAudio();
    transport.play();
    dispatch({ type: transport.currentBeat < 0 ? "play" : "resume" });
  }, [recoveryState, state.phase, transport]);

  const pause = useCallback(() => {
    if (recoveryState) return;
    transport.pause();
    dispatch({ type: "pause" });
  }, [recoveryState, transport]);

  const restart = useCallback(() => {
    if (recoveryTimerRef.current !== undefined) {
      window.clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = undefined;
    }
    transport.restart();
    judgeStateRef.current = createTimelineJudgeState();
    savedCompletionRef.current = false;
    setActiveNotes([]);
    setRecoveryState(undefined);
    dispatch({ type: "restart" });
  }, [transport]);

  const changeTempo = useCallback(
    (percent: number) => {
      if (transport.isPlaying) {
        transport.pause();
        dispatch({ type: "pause" });
      }
      setTempoPercent(percent);
      transport.setBpm(tempoFromPercent(timeline.originalBpm, percent));
      saveTempoPercent(lesson.courseSlug, lesson.slug, percent);
    },
    [lesson.courseSlug, lesson.slug, timeline.originalBpm, transport]
  );

  const handleAttempt = useCallback(
    (attempt: NoteAttempt) => {
      try {
        warmAudio();
      } catch {
        // Visual scoring must keep working if audio is unavailable.
      }

      if (attempt.phase === "press") {
        setActiveNotes((current) =>
          current.includes(attempt.note) ? current : [...current, attempt.note]
        );
        try {
          playNote(attempt.note);
        } catch {
          // Visual scoring must keep working if audio is unavailable.
        }
      } else {
        setActiveNotes((current) => current.filter((note) => note !== attempt.note));
      }

      if (completed) return;

      if (recoveryState) {
        const event = noteEvents.find((item) => item.id === recoveryState.eventId);
        if (!event) return;
        const recovered =
          attempt.phase === "press"
            ? applyGuidedRecoveryPress(recoveryState, event, attempt.note, attempt.timestampMs)
            : applyGuidedRecoveryRelease(
                recoveryState,
                event,
                attempt.note,
                attempt.timestampMs,
                transport.selectedBpm,
                DEFAULT_TIMING_WINDOWS
              );
        setRecoveryState(recovered.state);

        if (recovered.type === "wrong") {
          dispatch({
            type: "wrong-input",
            feedback: {
              classification: "wrong",
              label: event.notes.length > 1 ? "Play the full chord" : `Wrong key — play ${event.notes[0]}`
            }
          });
          return;
        }
        if (recovered.type === "progress" || recovered.type === "retry") {
          dispatch({
            type: "feedback",
            feedback: {
              classification: recovered.type === "retry" ? "partial" : "good",
              label: recovered.label
            }
          });
          return;
        }
        if (recovered.type === "completed") {
          finishRecovery(event.id);
        }
        return;
      }

      const activeBeat = transport.getBeatAtTimestamp(attempt.timestampMs);
      const isReleaseForPendingHold =
        attempt.phase === "release" && judgeStateRef.current.pendingHold !== undefined;
      if ((!transport.isPlaying && !isReleaseForPendingHold) || activeBeat < 0) {
        return;
      }

      const elapsedMs = transport.getElapsedMillisecondsAt(attempt.timestampMs);
      const judged =
        attempt.phase === "press"
          ? judgeTimelineInput(
              judgeStateRef.current,
              noteEvents,
              attempt.note,
              elapsedMs,
              transport.selectedBpm
            )
          : judgeTimelineRelease(
              judgeStateRef.current,
              noteEvents,
              attempt.note,
              elapsedMs,
              transport.selectedBpm
            );

      judgeStateRef.current = judged.state;
      if (judged.type === "ignored") return;

      if (judged.type === "pending-chord") {
        dispatch({
          type: "feedback",
          feedback: { classification: "partial", label: "Complete the chord" }
        });
        return;
      }

      if (judged.type === "holding") {
        dispatch({
          type: "feedback",
          feedback: { classification: "good", deltaMs: judged.onsetDeltaMs, label: "Hold" }
        });
        return;
      }

      if (judged.type === "wrong") {
        dispatch({
          type: "wrong-input",
          feedback: { classification: "wrong", deltaMs: judged.result.deltaMs, label: "Wrong note" }
        });
        return;
      }

      dispatch({ type: "event-result", result: judged.result });
      if (recoveryEnabled && judged.result.classification === "partial") {
        beginRecovery(judged.result.eventId, "Hold longer");
      }
    },
    [
      beginRecovery,
      completed,
      finishRecovery,
      noteEvents,
      recoveryEnabled,
      recoveryState,
      transport
    ]
  );

  useTimelineInput(handleAttempt);

  const handlePianoInput = useCallback(
    (note: NoteId) => {
      handleAttempt({
        note,
        source: "on-screen-piano",
        timestampMs: performance.now(),
        phase: "press"
      });
    },
    [handleAttempt]
  );

  const handlePianoRelease = useCallback(
    (note: NoteId) => {
      handleAttempt({
        note,
        source: "on-screen-piano",
        timestampMs: performance.now(),
        phase: "release"
      });
    },
    [handleAttempt]
  );

  useEffect(() => {
    if (!completed || savedCompletionRef.current) return;
    savedCompletionRef.current = true;
    recordLessonCompletion(
      loadProgress().progress,
      progressSummaryToLegacyCompletion(summary, noteEvents.length, lesson)
    );
    onProgressSaved();
  }, [completed, lesson, noteEvents.length, onProgressSaved, summary]);

  const coursePath = `/courses/${lesson.courseSlug}`;
  const continuePath = nextLessonSlug
    ? `/courses/${lesson.courseSlug}/lessons/${nextLessonSlug}`
    : coursePath;
  const progressPercent = Math.min(
    100,
    Math.max(0, (transport.currentBeat / timeline.totalBeats) * 100)
  );
  const statusTitle =
    transport.currentBeat < 0
      ? "Count in"
      : completed
        ? "Complete"
        : recoveryLocked
          ? "Waiting for you"
          : state.phase === "recovery-confirmation"
            ? "Recovered"
            : transport.isPlaying
              ? "Guided Play"
              : "Paused";
  const statusMessage =
    transport.currentBeat < 0
      ? `${Math.ceil(-transport.currentBeat)} beats`
      : completed
        ? "Lesson complete"
        : recoveryLocked
          ? recoveryPrompt(recoveryEvent, recoveryState)
          : feedbackLabel(state.feedback);

  return (
    <MobileLandscapeShell
      active={mobileLandscapeActive}
      className="timeline-player-page bg-[#12110f] text-stone-100"
    >
      <SiteHeader />
      <main className="timeline-player-main min-h-[100dvh] bg-[#12110f] text-stone-100">
        <div className="timeline-player-workspace mx-auto grid w-full max-w-7xl gap-3 px-4 py-4 md:px-6">
          <nav className="timeline-player-header flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Link className="font-bold text-amber-100 hover:underline" to={coursePath}>
                {lesson.courseTitle}
              </Link>
              <h1 className="mt-1 break-words text-2xl font-black text-white">{lesson.title}</h1>
            </div>
            <div className="font-mono text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              {timingSourceLabel(timeline)}
            </div>
          </nav>

          <section className="timeline-transport grid gap-3 border-y border-white/10 py-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label={transport.isPlaying ? "Pause lesson" : "Play lesson"}
                  onClick={transport.isPlaying ? pause : play}
                  disabled={recoveryLocked || state.phase === "recovery-confirmation"}
                  className="min-h-11 min-w-28 rounded-md bg-amber-200 px-4 font-black text-stone-950 transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {recoveryLocked
                    ? "Waiting"
                    : transport.isPlaying
                      ? "Pause"
                      : state.phase === "paused"
                        ? "Resume"
                        : "Play"}
                </button>
                <button
                  type="button"
                  aria-label="Restart lesson"
                  onClick={restart}
                  className="min-h-11 rounded-md border border-white/15 px-4 font-bold text-stone-100 transition active:translate-y-px"
                >
                  Restart
                </button>
                <span className="font-mono text-sm font-bold text-stone-300">
                  Beat {Math.max(0, transport.currentBeat).toFixed(1)} / {timeline.totalBeats}
                </span>
              </div>
              <div
                className="timeline-progress-track h-2 overflow-hidden rounded-full bg-white/10"
                aria-hidden="true"
              >
                <div className="h-full bg-amber-200" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <TempoControl
              originalBpm={timeline.originalBpm}
              percent={tempoPercent}
              disabled={recoveryLocked}
              onChange={changeTempo}
            />
          </section>

          <section className="timeline-status grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div
              aria-live="polite"
              className={`min-h-12 border-l-4 pl-3 ${recoveryLocked ? "border-sky-300" : "border-amber-200"}`}
            >
              <p className="text-xs font-bold text-stone-400">{statusTitle}</p>
              <p className="break-words text-xl font-black text-white">{statusMessage}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 font-mono text-sm">
              <span>
                <strong className="block text-lg text-emerald-300">{state.score}</strong>
                Score
              </span>
              <span>
                <strong className="block text-lg text-amber-200">{state.combo}</strong>
                Combo
              </span>
              <span>
                <strong className="block text-lg text-stone-100">
                  {Math.round(summary.scorePercent * 100)}%
                </strong>
                Rhythm
              </span>
            </div>
          </section>

          <section
            className="timeline-player-note-lane grid min-w-0 gap-2"
            data-testid="timeline-note-lane"
          >
            <FallingNotesStage
              ref={stageRef}
              events={noteEvents}
              geometry={geometry}
              currentBeat={transport.currentBeat}
              getCurrentBeat={transport.isPlaying ? transport.getCurrentBeat : undefined}
              results={scoreableResults(state.resultsByEventId)}
              targetEventId={activeTargetEvent?.id}
              recoveryEventId={recoveryEvent?.id}
            />

            <CoursePiano
              ref={pianoRef}
              className="timeline-player-piano"
              targetNotes={completed ? [] : targetNotes}
              activeNotes={activeNotes}
              autoScrollNotes={targetNotes}
              fitToContainer={mobileLandscapeActive}
              size={mobileLandscapeActive ? "compact" : "standard"}
              orientationMode={mobileLandscapeActive ? "mobile-landscape" : "responsive"}
              onInput={handlePianoInput}
              onRelease={handlePianoRelease}
              onPrepareAudio={warmAudio}
            />
          </section>

          {completed ? (
            <section className="timeline-player-completion grid gap-3 border-l-4 border-emerald-300 bg-emerald-950/25 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-black">Lesson complete</h2>
                <p className="text-emerald-100">
                  {summary.score} / {summary.maxPossibleScore} points / max combo {summary.maxCombo}{" "}
                  / {formatDuration(summary.durationMs)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={restart}
                  className="rounded-md bg-emerald-100 px-4 py-2 font-black text-emerald-950"
                >
                  Replay
                </button>
                <Link
                  to={continuePath}
                  className="rounded-md bg-stone-100 px-4 py-2 font-black text-stone-950"
                >
                  {nextLessonSlug ? "Next lesson" : "Return to course"}
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </MobileLandscapeShell>
  );
};
