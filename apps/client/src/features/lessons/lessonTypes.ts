import type { NoteId } from "../notes";

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  notes: NoteId[];
  order: number;
};

export type LessonFeedback = "idle" | "correct" | "incorrect" | "complete";

export type LessonSessionStatus = "active" | "complete";

export type LessonSession = {
  lessonId: string;
  currentIndex: number;
  status: LessonSessionStatus;
};
