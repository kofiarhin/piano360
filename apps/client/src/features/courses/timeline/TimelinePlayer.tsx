import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { playNote, warmAudio } from "../../../audio/NotePlayer";
import { MobileLandscapeShell, useMobileLandscapeMode } from "../../../shared/MobileLandscapeShell";
import { SiteHeader } from "../../../shared/SiteHeader";
import { CoursePiano } from "../CoursePiano";
import type {
  NoteId,
  TimedNoteEvent,
  TimelineLessonDetail,
  TimelinePracticeMode
} from "../courseTypes";
import { recordLessonCompletion, loadProgress } from "../progressStorage";
import { TempoControl } from "./TempoControl";
import { TimelineViewport } from "./TimelineViewport";
import { TransportControls } from "./TransportControls";
import { beatToMilliseconds, tempoFromPercent } from "./timelineMath";
import {
  createTimelineJudgeState,
  expireMissedEvents,
  judgeTimelineInput,
  type TimingClassification,
  type TimingResult,
  type TimelineJudgeState
} from "./timingJudge";
import { loadTempoPercent, saveTempoPercent } from "./tempoStorage";
import { useTimelineInput } from "./useTimelineInput";
import { useTimelineTransport } from "./useTimelineTransport";

type TimelinePlayerProps = {
  lesson: TimelineLessonDetail;
  nextLessonSlug?: string;
  onProgressSaved: () => void;
};

const classificationScore: Record<"perfect" | "good" | "accepted", number> = {
  perfect: 1,
  good: 0.8,
  accepted: 0.5
};

const summarizeResults = (results: TimingResult[], durationMs: number, restartCount: number) => {
  const successful = results.filter(
    (result): result is TimingResult & { classification: "perfect" | "good" | "accepted" } =>
      ["perfect", "good", "accepted"].includes(result.classification)
  );
  const misses = results.filter((result) => result.classification === "missed").length;
  const wrong = results.filter((result) => result.classification === "wrong").length;
  const judgedEvents = successful.length + misses;
  const meanAbsoluteTimingErrorMs = successful.length
    ? successful.reduce((sum, result) => sum + Math.abs(result.deltaMs), 0) / successful.length
    : 0;
  const rhythmicAccuracy = judgedEvents
    ? successful.reduce((sum, result) => sum + classificationScore[result.classification], 0) /
      judgedEvents
    : 0;

  return {
    correctInputs: successful.length,
    incorrectInputs: misses + wrong,
    accuracy: successful.length / Math.max(1, successful.length + misses + wrong),
    durationMs,
    restartCount,
    perfectInputs: successful.filter((result) => result.classification === "perfect").length,
    goodInputs: successful.filter((result) => result.classification === "good").length,
    acceptedInputs: successful.filter((result) => result.classification === "accepted").length,
    missedInputs: misses,
    wrongInputs: wrong,
    meanAbsoluteTimingErrorMs,
    rhythmicAccuracy
  };
};

export const TimelinePlayer = ({
  lesson,
  nextLessonSlug,
  onProgressSaved
}: TimelinePlayerProps) => {
  const mobileLandscapeActive = useMobileLandscapeMode();
  const noteEvents = useMemo(
    () => lesson.timeline.events.filter((event): event is TimedNoteEvent => event.type === "note"),
    [lesson.timeline.events]
  );
  const [tempoPercent, setTempoPercent] = useState(() =>
    loadTempoPercent(lesson.courseSlug, lesson.slug)
  );
  const initialBpm = tempoFromPercent(lesson.timeline.originalBpm, tempoPercent);
  const timingWindows = lesson.timeline.instructionalTemplate?.timingWindows;
  const transport = useTimelineTransport({
    bpm: initialBpm,
    totalBeats: lesson.timeline.totalBeats,
    countInBeats: lesson.timeline.countInBeats
  });
  const [practiceMode, setPracticeMode] = useState<TimelinePracticeMode>(
    lesson.defaultPracticeMode
  );
  const [results, setResults] = useState<TimingResult[]>([]);
  const [feedback, setFeedback] = useState("Ready");
  const [waitingEventId, setWaitingEventId] = useState<string>();
  const [waitingNotes, setWaitingNotes] = useState<NoteId[]>([]);
  const [restartCount, setRestartCount] = useState(0);
  const judgeStateRef = useRef<TimelineJudgeState>(createTimelineJudgeState());
  const savedCompletionRef = useRef(false);

  const appendResults = useCallback((nextResults: TimingResult[]) => {
    if (nextResults.length === 0) return;
    setResults((current) => [...current, ...nextResults]);
  }, []);

  useEffect(() => {
    if (transport.currentBeat < 0 || transport.isComplete || waitingEventId) return;
    const expired = expireMissedEvents(
      judgeStateRef.current,
      noteEvents,
      beatToMilliseconds(transport.currentBeat, transport.selectedBpm),
      transport.selectedBpm,
      timingWindows
    );
    if (expired.results.length === 0) return;

    judgeStateRef.current = expired.state;
    appendResults(expired.results);
    setFeedback(
      expired.results.length === 1 ? "Missed note" : `${expired.results.length} notes missed`
    );

    if (practiceMode === "guided" && lesson.behaviour.pauseOnMiss) {
      transport.pause();
      setWaitingEventId(expired.results[0]?.eventId);
      setWaitingNotes([]);
    }
  }, [
    appendResults,
    noteEvents,
    lesson.behaviour.pauseOnMiss,
    practiceMode,
    transport.currentBeat,
    transport.isComplete,
    transport.pause,
    transport.selectedBpm,
    timingWindows,
    waitingEventId
  ]);

  const handleInput = useCallback(
    (note: NoteId) => {
      warmAudio();
      playNote(note);

      const waitingEvent = noteEvents.find((event) => event.id === waitingEventId);
      if (waitingEvent) {
        if (!waitingEvent.notes.includes(note)) {
          appendResults([
            {
              eventId: waitingEvent.id,
              classification: "wrong",
              deltaMs: 0,
              playedNotes: [note]
            }
          ]);
          setFeedback("Wrong note · try the highlighted notes");
          return;
        }

        const collected = waitingNotes.includes(note) ? waitingNotes : [...waitingNotes, note];
        if (!waitingEvent.notes.every((target) => collected.includes(target))) {
          setWaitingNotes(collected);
          setFeedback("Complete the chord");
          return;
        }

        setWaitingEventId(undefined);
        setWaitingNotes([]);
        setFeedback("Recovered · resuming");
        transport.play();
        return;
      }

      if (!transport.isPlaying || transport.getCurrentBeat() < 0) return;
      const elapsedMs = beatToMilliseconds(transport.getCurrentBeat(), transport.selectedBpm);
      const judged = judgeTimelineInput(
        judgeStateRef.current,
        noteEvents,
        note,
        elapsedMs,
        transport.selectedBpm,
        timingWindows
      );
      judgeStateRef.current = judged.state;
      if (!judged.result) {
        setFeedback("Complete the chord");
        return;
      }

      appendResults([judged.result]);
      const label = judged.result.classification;
      setFeedback(
        label === "wrong"
          ? "Wrong note"
          : `${label[0]?.toUpperCase()}${label.slice(1)} · ${judged.result.deltaMs > 0 ? "+" : ""}${Math.round(judged.result.deltaMs)} ms`
      );
    },
    [appendResults, noteEvents, timingWindows, transport, waitingEventId, waitingNotes]
  );

  useTimelineInput(handleInput);

  const resultMap = useMemo(
    () =>
      Object.fromEntries(
        results
          .filter((result) => result.classification !== "wrong")
          .map((result) => [result.eventId, result.classification])
      ) as Record<string, TimingClassification>,
    [results]
  );
  const nextEvent =
    noteEvents.find((event) => event.id === waitingEventId) ??
    noteEvents.find((event) => !judgeStateRef.current.judgedEventIds.includes(event.id));
  const targetNotes = nextEvent?.notes ?? [];
  const summary = summarizeResults(
    results,
    beatToMilliseconds(lesson.timeline.totalBeats, transport.selectedBpm),
    restartCount
  );

  useEffect(() => {
    if (!transport.isComplete || waitingEventId || savedCompletionRef.current) return;
    savedCompletionRef.current = true;
    recordLessonCompletion(loadProgress().progress, {
      courseSlug: lesson.courseSlug,
      lessonSlug: lesson.slug,
      completedAt: new Date().toISOString(),
      ...summary
    });
    onProgressSaved();
  }, [
    lesson.courseSlug,
    lesson.slug,
    onProgressSaved,
    summary,
    transport.isComplete,
    waitingEventId
  ]);

  const restart = () => {
    transport.restart();
    judgeStateRef.current = createTimelineJudgeState();
    savedCompletionRef.current = false;
    setResults([]);
    setWaitingEventId(undefined);
    setWaitingNotes([]);
    setFeedback("Ready");
    setRestartCount((current) => current + 1);
  };

  const changeTempo = (percent: number) => {
    transport.pause();
    setTempoPercent(percent);
    transport.setBpm(tempoFromPercent(lesson.timeline.originalBpm, percent));
    saveTempoPercent(lesson.courseSlug, lesson.slug, percent);
  };

  const completed = transport.isComplete && !waitingEventId;

  return (
    <MobileLandscapeShell
      active={mobileLandscapeActive}
      className="timeline-player-page bg-[#12110f] text-stone-100"
    >
      <SiteHeader />
      <main className="timeline-player-main min-h-[100dvh] bg-[#12110f] text-stone-100">
        <div className="timeline-player-workspace mx-auto grid w-full max-w-7xl gap-3 px-4 py-4 md:px-6">
          <nav className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                className="font-bold text-amber-100 hover:underline"
                to={`/courses/${lesson.courseSlug}`}
              >
                {lesson.courseTitle}
              </Link>
              <h1 className="mt-1 break-words text-2xl font-black text-white">{lesson.title}</h1>
            </div>
            <div className="flex rounded-md border border-white/15 p-1" aria-label="Practice mode">
              {lesson.availablePracticeModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={practiceMode === mode}
                  onClick={() => {
                    transport.pause();
                    setPracticeMode(mode);
                  }}
                  className={[
                    "min-h-10 rounded px-3 text-sm font-black capitalize",
                    practiceMode === mode ? "bg-stone-100 text-stone-950" : "text-stone-300"
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </nav>

          <section className="timeline-transport flex min-w-0 flex-wrap items-end gap-3 border-y border-white/10 py-3">
            <TransportControls
              isPlaying={transport.isPlaying}
              currentBeat={transport.currentBeat}
              totalBeats={lesson.timeline.totalBeats}
              onPlay={transport.play}
              onPause={transport.pause}
              onRestart={restart}
              onSeek={transport.seek}
            />
            <TempoControl
              originalBpm={lesson.timeline.originalBpm}
              percent={tempoPercent}
              disabled={transport.isPlaying}
              onChange={changeTempo}
            />
          </section>

          <div className="timeline-status grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div aria-live="polite" className="min-h-12 border-l-4 border-amber-200 pl-3">
              <p className="text-xs font-bold text-stone-400">
                {transport.currentBeat < 0
                  ? "Count in"
                  : waitingEventId
                    ? "Guided recovery"
                    : "Now / Next"}
                {" / "}
                {lesson.timeline.timingSource === "instructional"
                  ? "Instructional timing"
                  : "Verified timing"}
              </p>
              <p className="break-words text-xl font-black text-white">
                {transport.currentBeat < 0
                  ? `${Math.ceil(-transport.currentBeat)} beats`
                  : completed
                    ? "Lesson complete"
                    : `${targetNotes.join(" + ") || "Listen"} · ${feedback}`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 font-mono text-sm">
              <span>
                <strong className="block text-lg text-emerald-300">{summary.perfectInputs}</strong>
                Perfect
              </span>
              <span>
                <strong className="block text-lg text-rose-300">{summary.missedInputs}</strong>
                Missed
              </span>
              <span>
                <strong className="block text-lg text-amber-200">
                  {lesson.behaviour.enableTimingScore
                    ? `${Math.round(summary.rhythmicAccuracy * 100)}%`
                    : "Off"}
                </strong>
                Rhythm
              </span>
            </div>
          </div>

          <TimelineViewport
            timeline={lesson.timeline}
            currentBeat={transport.currentBeat}
            results={resultMap}
            targetEventId={nextEvent?.id}
          />

          {completed ? (
            <section className="grid gap-3 border-l-4 border-emerald-300 bg-emerald-950/25 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-black">Timeline complete</h2>
                <p className="text-emerald-100">
                  {Math.round(summary.rhythmicAccuracy * 100)}% rhythmic accuracy ·{" "}
                  {Math.round(summary.meanAbsoluteTimingErrorMs)} ms average timing error
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
                {nextLessonSlug ? (
                  <Link
                    to={`/courses/${lesson.courseSlug}/lessons/${nextLessonSlug}`}
                    className="rounded-md bg-stone-100 px-4 py-2 font-black text-stone-950"
                  >
                    Next lesson
                  </Link>
                ) : null}
              </div>
            </section>
          ) : null}

          <CoursePiano
            className="timeline-player-piano"
            targetNotes={targetNotes}
            activeNotes={waitingNotes}
            autoScrollNotes={targetNotes}
            fitToContainer={mobileLandscapeActive}
            onInput={handleInput}
            onPrepareAudio={warmAudio}
          />
        </div>
      </main>
    </MobileLandscapeShell>
  );
};
