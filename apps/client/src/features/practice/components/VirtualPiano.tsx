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
const BLACK_KEY_WIDTH_PERCENT = 6.4;

const whiteIndexBefore = (noteId: NoteId) => {
  const noteIndex = pianoKeys.findIndex((key) => key.noteId === noteId);
  return pianoKeys.slice(0, noteIndex).filter((key) => key.tone === "white").length - 1;
};

const blackKeyLeft = (noteId: NoteId) => {
  const boundaryPercent = ((whiteIndexBefore(noteId) + 1) / whiteNotes.length) * 100;
  return `calc(${boundaryPercent}% - ${BLACK_KEY_WIDTH_PERCENT / 2}%)`;
};

export const VirtualPiano = ({ currentNote, pressedStates, onPress }: VirtualPianoProps) => {
  const visualStateFor = (noteId: NoteId): KeyVisualState => pressedStates[noteId] ?? (noteId === currentNote ? "current" : "idle");

  return (
    <section
      aria-label="Virtual piano"
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(39,39,42,0.96),rgba(9,9,11,0.98))] p-3 shadow-[0_34px_120px_-58px_rgba(0,0,0,1)] md:rounded-[2.5rem] md:p-5"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="mb-3 flex items-center justify-between gap-3 px-2 md:mb-4 md:px-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-violet-200/80">Playable keyboard</p>
          <p className="mt-1 text-sm font-semibold text-zinc-400">Tap, click, or use the mapped computer keys.</p>
        </div>
        <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-400 sm:block">A3 → C5</div>
      </div>

      <div className="rounded-[1.6rem] border border-black/80 bg-[#16130f] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-22px_38px_rgba(0,0,0,0.42)] md:p-3">
        <div className="rounded-t-[1.1rem] border border-white/10 bg-[linear-gradient(180deg,#29231c,#0b0908)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(127,29,29,0.55),rgba(248,113,113,0.32),rgba(127,29,29,0.55))] shadow-[0_0_18px_rgba(248,113,113,0.18)]" />
        </div>

        <div className="piano-scroll -mx-1 overflow-x-auto px-1 pb-1 pt-0 md:mx-0 md:px-0">
          <div className="relative mx-auto h-[17.5rem] min-w-[46rem] overflow-hidden rounded-b-[1.35rem] bg-zinc-950 p-2 pb-3 shadow-[inset_0_12px_24px_rgba(0,0,0,0.75)] sm:h-[19rem] md:h-[22rem] md:min-w-0 lg:h-[24rem]">
            <div className="pointer-events-none absolute inset-x-2 top-2 z-[3] h-7 rounded-t-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
            <div className="flex h-full w-full gap-[3px] rounded-b-xl">
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
            {blackNotes.map((key) => (
              <PianoKey
                key={key.noteId}
                noteId={key.noteId}
                tone={key.tone}
                keyboardKey={key.keyboardKey}
                visualState={visualStateFor(key.noteId)}
                style={{ left: blackKeyLeft(key.noteId), width: `${BLACK_KEY_WIDTH_PERCENT}%` }}
                onPress={onPress}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
