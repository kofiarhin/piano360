import { pianoKeys } from "../practiceData";
import type { NoteId } from "../practiceTypes";
import { PianoKey, type KeyVisualState } from "./PianoKey";

type VirtualPianoProps = {
  currentNote?: NoteId;
  pressedStates: Partial<Record<NoteId, KeyVisualState>>;
  onPress: (noteId: NoteId) => void;
};

const whiteNotes = pianoKeys.filter((key) => key.tone === "white");
const blackNotes = pianoKeys.filter((key) => key.tone === "black");

const whiteIndexBefore = (noteId: NoteId) => {
  const noteIndex = pianoKeys.findIndex((key) => key.noteId === noteId);
  return pianoKeys.slice(0, noteIndex).filter((key) => key.tone === "white").length - 1;
};

export const VirtualPiano = ({ currentNote, pressedStates, onPress }: VirtualPianoProps) => {
  const visualStateFor = (noteId: NoteId): KeyVisualState => pressedStates[noteId] ?? (noteId === currentNote ? "current" : "idle");

  return (
    <section aria-label="Virtual piano" className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-3 shadow-[0_28px_90px_-62px_rgba(0,0,0,0.95)] md:p-5">
      <div className="relative mx-auto flex max-w-7xl overflow-hidden rounded-[1.25rem] bg-zinc-800 p-2 pb-3">
        <div className="flex w-full gap-1">
          {whiteNotes.map((key) => (
            <PianoKey
              key={key.noteId}
              noteId={key.noteId}
              tone={key.tone}
              keyboardKey={key.keyboardKey}
              visualState={visualStateFor(key.noteId)}
              onPress={onPress}
            />
          ))}
        </div>
        {blackNotes.map((key) => {
          const left = ((whiteIndexBefore(key.noteId) + 1) / whiteNotes.length) * 100;

          return (
            <PianoKey
              key={key.noteId}
              noteId={key.noteId}
              tone={key.tone}
              keyboardKey={key.keyboardKey}
              visualState={visualStateFor(key.noteId)}
              style={{ left: `calc(${left}% - 3.6%)` }}
              onPress={onPress}
            />
          );
        })}
      </div>
    </section>
  );
};
