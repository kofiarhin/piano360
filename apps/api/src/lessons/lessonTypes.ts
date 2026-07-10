import type { NoteId } from "../notes";

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  notes: NoteId[];
  order: number;
};
