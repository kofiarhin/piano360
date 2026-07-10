import type { CSSProperties, PointerEvent } from "react";

import { keyboardKeys } from "./courseKeyboard";
import type { NoteId } from "./courseTypes";

export type KeyVisualState = "idle" | "target" | "active" | "correct" | "wrong";

type CoursePianoProps = {
  targetNotes: NoteId[];
  activeNotes?: NoteId[];
  wrongNote?: NoteId;
  onInput: (noteId: NoteId) => void;
};

const whiteKeys = keyboardKeys.filter((key) => key.tone === "white");
const blackKeys = keyboardKeys.filter((key) => key.tone === "black");
const BLACK_KEY_WIDTH_PERCENT = 6.2;

const whiteIndexBefore = (noteId: NoteId) => {
  const index = keyboardKeys.findIndex((key) => key.noteId === noteId);
  return keyboardKeys.slice(0, index).filter((key) => key.tone === "white").length - 1;
};

const blackKeyLeft = (noteId: NoteId) => {
  const boundaryPercent = ((whiteIndexBefore(noteId) + 1) / whiteKeys.length) * 100;
  return `calc(${boundaryPercent}% - ${BLACK_KEY_WIDTH_PERCENT / 2}%)`;
};

const getVisualState = (
  noteId: NoteId,
  targetNotes: NoteId[],
  activeNotes: NoteId[],
  wrongNote?: NoteId
): KeyVisualState => {
  if (wrongNote === noteId) {
    return "wrong";
  }

  if (activeNotes.includes(noteId)) {
    return "active";
  }

  if (targetNotes.includes(noteId)) {
    return "target";
  }

  return "idle";
};

const whiteStateClasses: Record<KeyVisualState, string> = {
  idle: "bg-[linear-gradient(180deg,#fff_0%,#f2f2f0_55%,#dbd7cf_100%)] text-zinc-900",
  target: "bg-[linear-gradient(180deg,#fff7ed_0%,#fed7aa_100%)] text-zinc-950 ring-4 ring-amber-700/45",
  active: "bg-[linear-gradient(180deg,#ecfdf5_0%,#86efac_100%)] text-zinc-950 ring-4 ring-emerald-700/45",
  correct: "bg-[linear-gradient(180deg,#ecfdf5_0%,#86efac_100%)] text-zinc-950 ring-4 ring-emerald-700/45",
  wrong: "bg-[linear-gradient(180deg,#fff1f2_0%,#fda4af_100%)] text-zinc-950 ring-4 ring-rose-700/45"
};

const blackStateClasses: Record<KeyVisualState, string> = {
  idle: "bg-[linear-gradient(90deg,#050505,#242424_40%,#050505)] text-zinc-100",
  target: "bg-[linear-gradient(180deg,#92400e,#120a04)] text-amber-50 ring-2 ring-amber-300",
  active: "bg-[linear-gradient(180deg,#047857,#07110c)] text-emerald-50 ring-2 ring-emerald-300",
  correct: "bg-[linear-gradient(180deg,#047857,#07110c)] text-emerald-50 ring-2 ring-emerald-300",
  wrong: "bg-[linear-gradient(180deg,#be123c,#150509)] text-rose-50 ring-2 ring-rose-300"
};

type PianoKeyButtonProps = {
  noteId: NoteId;
  tone: "white" | "black";
  keyboardKey: string;
  visualState: KeyVisualState;
  style?: CSSProperties;
  onInput: (noteId: NoteId) => void;
};

const PianoKeyButton = ({
  noteId,
  tone,
  keyboardKey,
  visualState,
  style,
  onInput
}: PianoKeyButtonProps) => {
  const isBlack = tone === "black";

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onInput(noteId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <button
      type="button"
      aria-label={`${noteId}, ${tone} key, keyboard ${keyboardKey}`}
      data-note-id={noteId}
      data-tone={tone}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
      style={style}
      className={[
        "touch-none select-none border text-center font-black shadow-sm transition active:translate-y-1 focus-visible:z-30",
        isBlack
          ? "absolute top-2 z-20 h-[60%] rounded-b-md border-zinc-950 px-1 pt-8 text-xs"
          : "relative h-56 flex-1 rounded-b-lg border-zinc-300 px-1 pb-4 pt-36 text-sm sm:h-64 sm:pt-44",
        isBlack ? blackStateClasses[visualState] : whiteStateClasses[visualState]
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-1/2 grid -translate-x-1/2 place-items-center rounded-md border font-mono font-black",
          isBlack
            ? "top-3 h-6 min-w-6 border-white/20 bg-white/15 text-[0.68rem]"
            : "bottom-10 h-7 min-w-7 border-zinc-300 bg-white/70 text-xs text-zinc-700"
        ].join(" ")}
      >
        {keyboardKey}
      </span>
      <span className={isBlack ? "text-base" : "text-2xl"}>{noteId}</span>
    </button>
  );
};

export const CoursePiano = ({ targetNotes, activeNotes = [], wrongNote, onInput }: CoursePianoProps) => {
  const visualStateFor = (noteId: NoteId) => getVisualState(noteId, targetNotes, activeNotes, wrongNote);

  return (
    <section aria-label="Virtual piano" className="rounded-2xl border border-stone-800 bg-stone-950 p-2 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.95)]">
      <div className="rounded-xl border border-stone-700 bg-[#191511] p-2">
        <div className="h-3 rounded-t-lg bg-[linear-gradient(90deg,#2f261f,#6f3f2d,#2f261f)]" />
        <div className="piano-scroll relative overflow-x-auto rounded-b-xl bg-zinc-950 p-2">
          <div className="relative mx-auto h-64 min-w-[46rem] sm:h-72 md:min-w-0">
            <div className="flex h-full gap-[3px]">
              {whiteKeys.map((key) => (
                <PianoKeyButton
                  key={key.noteId}
                  noteId={key.noteId}
                  tone={key.tone}
                  keyboardKey={key.keyboardKey}
                  visualState={visualStateFor(key.noteId)}
                  onInput={onInput}
                />
              ))}
            </div>
            {blackKeys.map((key) => (
              <PianoKeyButton
                key={key.noteId}
                noteId={key.noteId}
                tone={key.tone}
                keyboardKey={key.keyboardKey}
                visualState={visualStateFor(key.noteId)}
                style={{ left: blackKeyLeft(key.noteId), width: `${BLACK_KEY_WIDTH_PERCENT}%` }}
                onInput={onInput}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
