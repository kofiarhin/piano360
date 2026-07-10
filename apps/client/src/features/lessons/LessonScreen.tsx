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
  const progressValue = session.status === "complete" ? selectedLesson.notes.length : session.currentIndex + 1;
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
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col gap-6 px-4 py-5 text-zinc-100 md:px-6 md:py-8">
      <header className="grid gap-5 border-b border-white/10 pb-5 md:grid-cols-[1fr_minmax(17rem,22rem)] md:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80">
            Note recognition
          </p>
          <h1 className="mt-2 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
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

      <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.35fr)] lg:items-stretch">
        <div className="flex flex-col justify-between gap-6 rounded-[1.5rem] border border-white/10 bg-zinc-950/78 p-5 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.95)] md:p-7">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black leading-tight text-white">{selectedLesson.title}</h2>
                {selectedLesson.description && (
                  <p className="mt-2 max-w-[42ch] text-base leading-relaxed text-zinc-300">
                    {selectedLesson.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                <p className="font-mono text-xs font-bold uppercase text-zinc-400">Progress</p>
                <p className="font-mono text-lg font-black text-white" data-testid="lesson-progress">
                  {progressValue} / {selectedLesson.notes.length}
                </p>
              </div>
            </div>

            <div className="mt-10">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                Current note
              </p>
              {currentNote ? (
                <NoteLabel
                  noteId={currentNote}
                  testId="current-note"
                  className="mt-3 block text-8xl font-black leading-none tracking-normal text-white md:text-9xl"
                />
              ) : (
                <p className="mt-3 text-5xl font-black text-white">Complete</p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div
              aria-live="polite"
              className={[
                "rounded-xl border px-4 py-3 text-lg font-black",
                feedback === "correct" ? "border-emerald-300/50 bg-emerald-400/12 text-emerald-100" : "",
                feedback === "incorrect" ? "border-rose-300/50 bg-rose-400/12 text-rose-100" : "",
                feedback === "complete" ? "border-cyan-200/50 bg-cyan-300/12 text-cyan-50" : "",
                feedback === "idle" ? "border-white/10 bg-white/[0.04] text-zinc-200" : ""
              ].join(" ")}
            >
              {feedbackText[feedback]}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => resetLesson()}
                className="rounded-xl border border-white/15 bg-white px-4 py-3 font-black text-zinc-950 transition active:translate-y-0.5"
              >
                Restart lesson
              </button>
              {session.status === "complete" && nextLesson && (
                <button
                  type="button"
                  onClick={() => setSelectedLessonId(nextLesson.id)}
                  className="rounded-xl border border-cyan-200/40 bg-cyan-200 px-4 py-3 font-black text-zinc-950 transition active:translate-y-0.5"
                >
                  Next lesson
                </button>
              )}
            </div>
          </div>
        </div>

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
