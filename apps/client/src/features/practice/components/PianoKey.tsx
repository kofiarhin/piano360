import { motion } from "framer-motion";
import type { CSSProperties } from "react";

import type { NoteId, PianoKeyTone } from "../practiceTypes";

export type KeyVisualState = "idle" | "current" | "pressed" | "correct" | "wrong";

type PianoKeyProps = {
  noteId: NoteId;
  tone: PianoKeyTone;
  keyboardKey?: string;
  visualState: KeyVisualState;
  style?: CSSProperties;
  onPress: (noteId: NoteId) => void;
};

const stateClass: Record<KeyVisualState, string> = {
  idle: "",
  current: "ring-2 ring-violet-300 bg-violet-200 text-zinc-950 shadow-[0_18px_45px_-22px_rgba(139,92,246,0.9)]",
  pressed: "ring-2 ring-violet-200 bg-violet-100 text-zinc-950",
  correct: "ring-2 ring-emerald-300 bg-emerald-100 text-zinc-950",
  wrong: "ring-2 ring-rose-300 bg-rose-200 text-zinc-950"
};

export const PianoKey = ({ noteId, tone, keyboardKey, visualState, style, onPress }: PianoKeyProps) => {
  const isBlack = tone === "black";
  const aria = `${noteId}, ${tone} key${keyboardKey ? `, keyboard ${keyboardKey}` : ""}`;

  return (
    <motion.button
      type="button"
      aria-label={aria}
      data-note-id={noteId}
      whileTap={{ scale: 0.985, y: 2 }}
      animate={{ y: visualState === "pressed" || visualState === "correct" ? 2 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={() => onPress(noteId)}
      style={style}
      className={[
        "select-none overflow-hidden border text-center font-black transition-colors focus-visible:z-20",
        isBlack
          ? "absolute top-0 z-[2] h-[58%] w-[7.2%] rounded-b-lg border-zinc-950 bg-zinc-950 pt-16 text-xs text-white shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
          : "relative h-64 flex-1 rounded-b-xl border-zinc-300 bg-gradient-to-b from-white to-zinc-200 pt-44 text-sm text-zinc-900 shadow-[inset_0_-12px_18px_rgba(0,0,0,0.08)] md:h-72 md:pt-52",
        stateClass[visualState]
      ].join(" ")}
    >
      {keyboardKey && (
        <span
          className={[
            "absolute left-1/2 top-4 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-md border px-1 font-mono text-[0.65rem]",
            isBlack ? "border-white/10 bg-white/10 text-zinc-300" : "border-zinc-300 bg-zinc-100 text-zinc-500"
          ].join(" ")}
        >
          {keyboardKey}
        </span>
      )}
      <span>{noteId}</span>
    </motion.button>
  );
};
