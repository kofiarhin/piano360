import type { Lesson, LessonSession } from "./lessonTypes";
import type { NoteId } from "../notes";

export const createLessonSession = (lesson: Lesson): LessonSession => ({
  lessonId: lesson.id,
  currentIndex: 0,
  status: lesson.notes.length > 0 ? "active" : "complete"
});

export const getCurrentLessonNote = (lesson: Lesson, session: LessonSession): NoteId | undefined =>
  session.status === "active" ? lesson.notes[session.currentIndex] : undefined;

export const isLessonInputCorrect = (
  lesson: Lesson,
  session: LessonSession,
  attemptedNoteId: NoteId
) => getCurrentLessonNote(lesson, session) === attemptedNoteId;

export const advanceLessonSession = (lesson: Lesson, session: LessonSession): LessonSession => {
  if (session.status === "complete") {
    return session;
  }

  const nextIndex = session.currentIndex + 1;

  if (nextIndex >= lesson.notes.length) {
    return {
      ...session,
      currentIndex: Math.max(0, lesson.notes.length - 1),
      status: "complete"
    };
  }

  return {
    ...session,
    currentIndex: nextIndex
  };
};
