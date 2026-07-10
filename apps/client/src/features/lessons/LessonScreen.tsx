import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { playNote } from "../../audio/NotePlayer";
import { NoteLabel, keyboardMap, type NoteId } from "../notes";
import { VirtualPiano } from "../practice/components/VirtualPiano";
import type { KeyVisualState } from "../practice/components/PianoKey";
import {
  advanceLessonSession,
  createLessonSession,
  getCurrentLessonNote,
  isLessonInputCorrect
} from "./lessonEngine";
import { getLessons } from "./lessonApi";
import type { Lesson, LessonFeedback, LessonSession } from "./lessonTypes";

const ADVANCE_DELAY_MS = 420;
const KEY_FLASH_MS = 260;

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));
};

const feedbackText: Record<LessonFeedback, string> = {
  idle: "Play the note shown",
  correct: "Correct",
  incorrect: "Try again",
  complete: "Lesson complete"
};

type LessonWorkspaceProps = {
  lessons: Lesson[];
};

const LessonWorkspace = ({ lessons }: LessonWorkspaceProps) => {
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0],
    [lessons, selectedLessonId]
  );
  const [session, setSession] = useState<LessonSession>(() => createLessonSession(selectedLesson));
  const [feedback, setFeedback] = useState<LessonFeedback>("idle");
  const [pressedStates, setPressedStates] = useState<Partial<Record<NoteId, KeyVisualState>>>({});
  const advanceTimerRef = useRef<number | undefined>(undefined);
  const flashTimerRef = useRef<number | undefined>(undefined);

  const currentNote = getCurrentLessonNote(selectedLesson, session);
  const progressValue =
    session.status === "complete" ? selectedLesson.notes.length : session.currentIndex + 1;
  const currentLessonIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
  const nextLesson = lessons[currentLessonIndex + 1];

  const resetLesson = useCallback(
    (lesson: Lesson = selectedLesson) => {
      window.clearTimeout(advanceTimerRef.current);
      window.clearTimeout(flashTimerRef.current);
      setSession(createLessonSession(lesson));
      setFeedback("idle");
      setPressedStates({});
    },
    [selectedLesson]
  );

  useEffect(() => {
    resetLesson(selectedLesson);
  }, [resetLesson, selectedLesson]);

  useEffect(
    () => () => {
      window.clearTimeout(advanceTimerRef.current);
      window.clearTimeout(flashTimerRef.current);
    },
    []
  );

  const flashKey = useCallback((noteId: NoteId, state: KeyVisualState) => {
    window.clearTimeout(flashTimerRef.current);
    setPressedStates({ [noteId]: state });
    flashTimerRef.current = window.setTimeout(() => {
      setPressedStates({});
    }, KEY_FLASH_MS);
  }, []);

  const handleNoteInput = useCallback(
    (noteId: NoteId) => {
      if (advanceTimerRef.current !== undefined || session.status === "complete") {
        return;
      }

      playNote(noteId);

      if (isLessonInputCorrect(selectedLesson, session, noteId)) {
        flashKey(noteId, "correct");
        setFeedback("correct");
        advanceTimerRef.current = window.setTimeout(() => {
          setSession((current) => {
            const next = advanceLessonSession(selectedLesson, current);
            setFeedback(next.status === "complete" ? "complete" : "idle");
            advanceTimerRef.current = undefined;
            return next;
          });
        }, ADVANCE_DELAY_MS);
        return;
      }

      flashKey(noteId, "wrong");
      setFeedback("incorrect");
    },
    [flashKey, selectedLesson, session]
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
      handleNoteInput(noteId);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNoteInput]);

  return (
    <main className="lesson-screen relative mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-4 text-zinc-100 md:px-6 md:py-5 lg:py-6">
      <header className="grid gap-4 border-b border-white/10 pb-4 md:grid-cols-[1fr_minmax(16rem,20rem)] md:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80">
            Note recognition
          </p>
          <h1 className="mt-2 text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
            Piano360
          </h1>
        </div>
        <label className="grid gap-2 text-sm font-bold text-zinc-200">
          Lesson
          <select
            aria-label="Lesson"
            value={selectedLesson.id}
            onChange={(event) => setSelectedLessonId(event.target.value)}
            className="rounded-xl border border-white/15 bg-zinc-950 px-4 py-3 text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition focus:border-cyan-200"
          >
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="flex flex-1 flex-col justify-end gap-2 pt-4 md:gap-3 md:pt-5">
        <section
          aria-labelledby="lesson-title"
          className="rounded-[1.25rem] border border-white/10 bg-zinc-950/78 p-4 shadow-[0_18px_70px_-52px_rgba(0,0,0,0.95)] md:p-5"
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center xl:grid-cols-[minmax(0,1.35fr)_auto_auto_minmax(14rem,0.9fr)] xl:gap-5">
            <div>
              <h2
                id="lesson-title"
                className="text-xl font-black leading-tight text-white md:text-2xl"
              >
                {selectedLesson.title}
              </h2>
              {selectedLesson.description && (
                <p className="mt-1.5 max-w-[54ch] text-sm leading-relaxed text-zinc-300 md:text-base">
                  {selectedLesson.description}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 lg:min-w-[7.75rem]">
              <p className="font-mono text-xs font-bold uppercase text-zinc-400">Progress</p>
              <p className="font-mono text-lg font-black text-white" data-testid="lesson-progress">
                {progressValue} / {selectedLesson.notes.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 lg:min-w-[9rem]">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                Current note
              </p>
              {currentNote ? (
                <NoteLabel
                  noteId={currentNote}
                  testId="current-note"
                  className="mt-1 block text-5xl font-black leading-none tracking-normal text-white md:text-6xl"
                />
              ) : (
                <p className="mt-1 text-3xl font-black text-white md:text-4xl">Complete</p>
              )}
            </div>

            <div className="grid gap-3 md:col-span-3 md:grid-cols-[minmax(12rem,1fr)_auto] md:items-center xl:col-span-1 xl:grid-cols-1">
              <div
                aria-live="polite"
                className={[
                  "rounded-xl border px-3 py-2 text-base font-black",
                  feedback === "correct"
                    ? "border-emerald-300/50 bg-emerald-400/12 text-emerald-100"
                    : "",
                  feedback === "incorrect" ? "border-rose-300/50 bg-rose-400/12 text-rose-100" : "",
                  feedback === "complete" ? "border-cyan-200/50 bg-cyan-300/12 text-cyan-50" : "",
                  feedback === "idle" ? "border-white/10 bg-white/[0.04] text-zinc-200" : ""
                ].join(" ")}
              >
                {feedbackText[feedback]}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => resetLesson()}
                  className="rounded-xl border border-white/15 bg-white px-4 py-2.5 font-black text-zinc-950 transition active:translate-y-0.5"
                >
                  Restart lesson
                </button>
                {session.status === "complete" && nextLesson && (
                  <button
                    type="button"
                    onClick={() => setSelectedLessonId(nextLesson.id)}
                    className="rounded-xl border border-cyan-200/40 bg-cyan-200 px-4 py-2.5 font-black text-zinc-950 transition active:translate-y-0.5"
                  >
                    Next lesson
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex min-w-0 flex-col justify-end">
          <VirtualPiano
            currentNote={currentNote}
            pressedStates={pressedStates}
            onPress={handleNoteInput}
          />
        </div>
      </section>
    </main>
  );
};

export const LessonScreen = () => {
  const lessonsQuery = useQuery({
    queryKey: ["lessons"],
    queryFn: getLessons
  });

  if (lessonsQuery.isLoading) {
    return (
      <main className="mx-auto grid min-h-[100dvh] w-full max-w-7xl content-center gap-5 px-4 text-zinc-100">
        <h1 className="text-4xl font-black text-white">Piano360</h1>
        <div className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.06]" />
      </main>
    );
  }

  if (lessonsQuery.isError) {
    return (
      <main className="mx-auto grid min-h-[100dvh] w-full max-w-7xl content-center gap-4 px-4 text-zinc-100">
        <h1 className="text-4xl font-black text-white">Piano360</h1>
        <p className="rounded-xl border border-rose-300/40 bg-rose-400/10 px-4 py-3 font-bold text-rose-100">
          Could not load lessons.
        </p>
      </main>
    );
  }

  const lessons = lessonsQuery.data;

  if (!lessons || lessons.length === 0) {
    return (
      <main className="mx-auto grid min-h-[100dvh] w-full max-w-7xl content-center gap-4 px-4 text-zinc-100">
        <h1 className="text-4xl font-black text-white">Piano360</h1>
        <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-bold text-zinc-200">
          No lessons available.
        </p>
      </main>
    );
  }

  return <LessonWorkspace lessons={lessons} />;
};
