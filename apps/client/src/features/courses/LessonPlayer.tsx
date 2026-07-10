import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { playNote } from "../../audio/NotePlayer";
import { CoursePiano } from "./CoursePiano";
import { keyboardMap } from "./courseKeyboard";
import type { LessonDetail, NoteId } from "./courseTypes";
import { courseQueryKeys, getCourse, getLesson } from "./courseQueries";
import { formatDuration, formatPercent } from "./formatMetrics";
import {
  CHORD_INPUT_WINDOW_MS,
  applyNoteInput,
  expireChordWindow,
  getCompletionSummary,
  initializeLessonSession,
  restartLessonSession,
  type LessonSession
} from "./lessonEngine";
import {
  isLessonUnlocked,
  loadProgress,
  recordLessonCompletion
} from "./progressStorage";

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));
};

type CompletionSummaryProps = {
  lesson: LessonDetail;
  session: LessonSession;
  nextLessonSlug?: string;
  onReplay: () => void;
};

const CompletionSummary = ({ lesson, session, nextLessonSlug, onReplay }: CompletionSummaryProps) => {
  const summary = getCompletionSummary(session);

  if (!summary) {
    return null;
  }

  return (
    <section className="rounded-xl border border-emerald-200/30 bg-emerald-950/25 p-4 text-emerald-50">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
            Lesson complete
          </p>
          <h2 className="mt-2 text-2xl font-black">{lesson.title}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/10 p-2">
            <p className="font-mono text-xs uppercase text-emerald-100/80">Correct</p>
            <p className="text-xl font-black">{summary.correctInputs}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-2">
            <p className="font-mono text-xs uppercase text-emerald-100/80">Wrong</p>
            <p className="text-xl font-black">{summary.incorrectInputs}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-2">
            <p className="font-mono text-xs uppercase text-emerald-100/80">Accuracy</p>
            <p className="text-xl font-black">{formatPercent(summary.accuracy)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-2">
            <p className="font-mono text-xs uppercase text-emerald-100/80">Duration</p>
            <p className="text-xl font-black">{formatDuration(summary.durationMs)}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReplay}
          className="rounded-lg bg-emerald-100 px-4 py-2 font-black text-emerald-950 transition active:translate-y-0.5"
        >
          Replay
        </button>
        {nextLessonSlug && (
          <Link
            to={`/courses/${lesson.courseSlug}/lessons/${nextLessonSlug}`}
            className="rounded-lg bg-stone-50 px-4 py-2 font-black text-stone-950 transition active:translate-y-0.5"
          >
            Next lesson
          </Link>
        )}
        <Link
          to={`/courses/${lesson.courseSlug}`}
          className="rounded-lg border border-white/20 px-4 py-2 font-black text-white transition active:translate-y-0.5"
        >
          Return to course
        </Link>
      </div>
    </section>
  );
};

type PlayerLoadedProps = {
  lesson: LessonDetail;
  courseLessons: Array<{ slug: string; order: number }>;
  onProgressSaved: () => void;
};

const PlayerLoaded = ({ lesson, courseLessons, onProgressSaved }: PlayerLoadedProps) => {
  const [session, setSession] = useState(() => initializeLessonSession(lesson));
  const [wrongNote, setWrongNote] = useState<NoteId>();
  const savedCompletionRef = useRef(false);
  const wrongTimerRef = useRef<number | undefined>(undefined);
  const chordTimerRef = useRef<number | undefined>(undefined);

  const currentStep = lesson.steps[session.currentStepIndex];
  const orderedLessonSlugs = useMemo(
    () => [...courseLessons].sort((first, second) => first.order - second.order).map((item) => item.slug),
    [courseLessons]
  );
  const nextLessonSlug = orderedLessonSlugs[orderedLessonSlugs.indexOf(lesson.slug) + 1];

  const resetWrongNote = useCallback(() => {
    window.clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = window.setTimeout(() => setWrongNote(undefined), 260);
  }, []);

  const handleInput = useCallback(
    (noteId: NoteId) => {
      if (session.status === "completed") {
        return;
      }

      playNote(noteId);
      const previousIncorrect = session.metrics.incorrectInputs;
      const nextSession = applyNoteInput(session, lesson, noteId);

      if (nextSession.metrics.incorrectInputs > previousIncorrect) {
        setWrongNote(noteId);
        resetWrongNote();
        window.clearTimeout(chordTimerRef.current);
      }

      setSession(nextSession);
    },
    [lesson, resetWrongNote, session]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) {
        return;
      }

      const noteId = keyboardMap[event.key.toLowerCase()];
      if (!noteId) {
        return;
      }

      event.preventDefault();
      handleInput(noteId);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInput]);

  useEffect(() => {
    window.clearTimeout(chordTimerRef.current);

    if (!session.chordAttempt || session.status === "completed") {
      return;
    }

    chordTimerRef.current = window.setTimeout(() => {
      setSession((current) => expireChordWindow(current, lesson));
    }, CHORD_INPUT_WINDOW_MS + 10);

    return () => window.clearTimeout(chordTimerRef.current);
  }, [lesson, session.chordAttempt, session.status]);

  useEffect(
    () => () => {
      window.clearTimeout(wrongTimerRef.current);
      window.clearTimeout(chordTimerRef.current);
    },
    []
  );

  useEffect(() => {
    const summary = getCompletionSummary(session);
    if (!summary || savedCompletionRef.current) {
      return;
    }

    savedCompletionRef.current = true;
    recordLessonCompletion(loadProgress().progress, {
      courseSlug: lesson.courseSlug,
      lessonSlug: lesson.slug,
      ...summary
    });
    onProgressSaved();
  }, [lesson.courseSlug, lesson.slug, onProgressSaved, session]);

  const replay = () => {
    savedCompletionRef.current = false;
    setSession(restartLessonSession(session, lesson));
    setWrongNote(undefined);
  };

  const restart = () => {
    setSession(restartLessonSession(session, lesson));
    setWrongNote(undefined);
  };

  return (
    <main className="min-h-[100dvh] bg-[#12110f] text-stone-100">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 md:px-6 lg:py-6">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Link className="font-bold text-amber-100 underline-offset-4 hover:underline" to={`/courses/${lesson.courseSlug}`}>
            {lesson.courseTitle}
          </Link>
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-black transition active:translate-y-0.5"
          >
            Restart
          </button>
        </nav>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-amber-200/80">
              {lesson.courseHand} hand / {currentStep?.type ?? "complete"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">{lesson.title}</h1>
            <p className="mt-1 text-stone-300">{currentStep?.instruction ?? "Lesson complete."}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-stone-950/70 px-3 py-2 font-mono font-black">
            {session.currentStepIndex + 1}/{lesson.steps.length}
          </div>
          <div
            aria-live="polite"
            className={[
              "rounded-lg border px-3 py-2 font-black",
              session.feedback === "correct" ? "border-emerald-200/40 bg-emerald-950/40 text-emerald-100" : "",
              session.feedback === "incorrect" ? "border-rose-200/40 bg-rose-950/40 text-rose-100" : "",
              session.feedback === "completed" ? "border-emerald-200/40 bg-emerald-950/40 text-emerald-100" : "",
              session.feedback === "idle" ? "border-white/10 bg-white/[0.04] text-stone-200" : ""
            ].join(" ")}
          >
            {session.feedback === "idle" && (currentStep?.type === "chord" ? "Play all highlighted notes" : "Play the highlighted note")}
            {session.feedback === "correct" && "Correct"}
            {session.feedback === "incorrect" && "Try again"}
            {session.feedback === "completed" && "Complete"}
          </div>
        </section>

        {session.status === "completed" ? (
          <CompletionSummary
            lesson={lesson}
            session={session}
            nextLessonSlug={nextLessonSlug}
            onReplay={replay}
          />
        ) : null}

        <CoursePiano
          targetNotes={currentStep?.targetNotes ?? []}
          activeNotes={session.activeNotes}
          wrongNote={wrongNote}
          onInput={handleInput}
        />
      </div>
    </main>
  );
};

type LessonPlayerProps = {
  onProgressSaved: () => void;
};

export const LessonPlayer = ({ onProgressSaved }: LessonPlayerProps) => {
  const { courseSlug, lessonSlug } = useParams();
  const progressState = loadProgress();

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.course(courseSlug ?? ""),
    queryFn: () => getCourse(courseSlug ?? ""),
    enabled: Boolean(courseSlug)
  });
  const courseLesson = courseQuery.data?.lessons.find((item) => item.slug === lessonSlug);
  const unlocked =
    courseQuery.data !== undefined &&
    courseLesson !== undefined &&
    isLessonUnlocked(progressState.progress, courseQuery.data, courseLesson);
  const lessonQuery = useQuery({
    queryKey: courseQueryKeys.lesson(courseSlug ?? "", lessonSlug ?? ""),
    queryFn: () => getLesson(courseSlug ?? "", lessonSlug ?? ""),
    enabled: Boolean(courseSlug && lessonSlug && unlocked)
  });

  if (!courseSlug || !lessonSlug) {
    return <Navigate to="/" replace />;
  }

  if (courseQuery.isLoading || (unlocked && lessonQuery.isLoading)) {
    return (
      <main className="min-h-[100dvh] bg-[#12110f] px-4 py-8 text-stone-100">
        <div className="mx-auto h-[32rem] max-w-7xl animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
      </main>
    );
  }

  if (courseQuery.isError || !courseQuery.data || !courseLesson) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#12110f] px-4 text-stone-100">
        <section className="max-w-lg rounded-xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-3xl font-black">Lesson not found</h1>
          <Link className="mt-4 inline-block rounded-lg bg-amber-200 px-4 py-2 font-black text-stone-950" to="/">
            Return to courses
          </Link>
        </section>
      </main>
    );
  }

  const course = courseQuery.data;

  if (!unlocked) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#12110f] px-4 text-stone-100">
        <section className="max-w-lg rounded-xl border border-white/10 bg-white/[0.04] p-6">
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-amber-200/80">
            Locked lesson
          </p>
          <h1 className="mt-2 text-3xl font-black">Complete the previous lesson first</h1>
          <p className="mt-2 text-stone-300">Playback is disabled until this lesson is unlocked.</p>
          <Link
            className="mt-4 inline-block rounded-lg bg-amber-200 px-4 py-2 font-black text-stone-950"
            to={`/courses/${courseSlug}`}
          >
            Return to course
          </Link>
        </section>
      </main>
    );
  }

  if (lessonQuery.isError || !lessonQuery.data) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#12110f] px-4 text-stone-100">
        <section className="max-w-lg rounded-xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-3xl font-black">Lesson not found</h1>
          <Link className="mt-4 inline-block rounded-lg bg-amber-200 px-4 py-2 font-black text-stone-950" to="/">
            Return to courses
          </Link>
        </section>
      </main>
    );
  }

  return (
    <PlayerLoaded
      key={`${lessonQuery.data.courseSlug}/${lessonQuery.data.slug}`}
      lesson={lessonQuery.data}
      courseLessons={course.lessons}
      onProgressSaved={onProgressSaved}
    />
  );
};
