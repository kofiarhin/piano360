import type { NoteId } from "./noteTypes";

type NoteLabelProps = {
  noteId: NoteId;
  className?: string;
  testId?: string;
};

export const formatNoteLabel = (noteId: NoteId): NoteId => noteId;

export const NoteLabel = ({ noteId, className, testId }: NoteLabelProps) => (
  <span className={className} data-testid={testId}>
    {formatNoteLabel(noteId)}
  </span>
);
