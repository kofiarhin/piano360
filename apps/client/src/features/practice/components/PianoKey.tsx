import { motion } from "framer-motion";
import type { CSSProperties, PointerEvent } from "react";

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

const whiteStateClass: Record<KeyVisualState, string> = {
  idle: "",
  current: "ring-2 ring-violet-300/90 bg-[linear-gradient(180deg,#f8f4ff_0%,#eee7ff_48%,#d8ccff_100%)] text-zinc-950 shadow-[inset_0_-16px_22px_rgba(88,28,135,0.16),0_18px_45px_-24px_rgba(139,92,246,0.95)]",
  pressed: "ring-2 ring-purple-300 !bg-none !bg-purple-700 !text-purple-50 !shadow-none !transition-none !duration-0",
  correct: "ring-2 ring-purple-300 !bg-none !bg-purple-700 !text-purple-50 !shadow-none !transition-none !duration-0",
  wrong: "ring-2 ring-purple-300 !bg-none !bg-purple-700 !text-purple-50 !shadow-none !transition-none !duration-0"
};

const blackStateClass: Record<KeyVisualState, string> = {
  idle: "",
  current: "ring-2 ring-violet-300 bg-[linear-gradient(180deg,#312e81_0%,#17112a_44%,#050507_100%)] text-violet-100 shadow-[0_18px_34px_rgba(0,0,0,0.7),0_0_22px_rgba(139,92,246,0.34)]",
  pressed: "ring-2 ring-purple-300 !bg-none !bg-purple-700 !text-purple-50 !shadow-none !transition-none !duration-0",
  correct: "ring-2 ring-purple-300 !bg-none !bg-purple-700 !text-purple-50 !shadow-none !transition-none !duration-0",
  wrong: "ring-2 ring-purple-300 !bg-none !bg-purple-700 !text-purple-50 !shadow-none !transition-none !duration-0"
};

export const PianoKey = ({ noteId, tone, keyboardKey, visualState, style, onPress }: PianoKeyProps) => {
  const isBlack = tone === "black";
  const isPressed = visualState === "pressed" || visualState === "correct" || visualState === "wrong";
  const aria = `${noteId}, ${tone} key${keyboardKey ? `, keyboard ${keyboardKey}` : ""}`;

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onPress(noteId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <motion.button
      type="button"
      aria-label={aria}
      data-note-id={noteId}
      data-tone={tone}
      whileTap={isBlack ? { y: 3, scaleY: 0.985 } : { y: 6, scaleY: 0.982 }}
      animate={isBlack ? { y: isPressed ? 3 : 0, scaleY: isPressed ? 0.99 : 1 } : { y: isPressed ? 6 : 0, scaleY: isPressed ? 0.985 : 1 }}
      transition={{ type: "spring", stiffness: 460, damping: 28, mass: 0.62 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
      style={{ ...style, transformOrigin: "top center" }}
      className={[
        "group touch-none select-none overflow-hidden border text-center font-black outline-none focus-visible:z-30",
        isPressed ? "transition-none duration-0" : "transition-[background,box-shadow,border-color,color] duration-150",
        isBlack
          ? "absolute top-2 z-20 h-[61%] rounded-b-[0.8rem] border-x-black border-b-black border-t-zinc-700 bg-[linear-gradient(90deg,#050505_0%,#171717_16%,#050505_48%,#252525_68%,#030303_100%)] px-1 pt-12 text-xs text-zinc-100 shadow-[0_18px_24px_rgba(0,0,0,0.7),inset_4px_0_8px_rgba(255,255,255,0.04),inset_-6px_0_10px_rgba(0,0,0,0.62)] sm:pt-14 md:pt-16"
          : "relative h-full flex-1 rounded-b-[1.05rem] border-x-zinc-300 border-b-zinc-400 border-t-zinc-100 bg-[linear-gradient(90deg,#d9d9dc_0%,#ffffff_8%,#f9fafb_52%,#e4e4e7_100%)] px-1 pb-5 pt-[11.75rem] text-sm text-zinc-900 shadow-[inset_5px_0_10px_rgba(255,255,255,0.9),inset_-7px_0_12px_rgba(0,0,0,0.08),inset_0_-18px_20px_rgba(0,0,0,0.10),0_10px_18px_rgba(0,0,0,0.18)] sm:pt-[12.8rem] md:pt-[15.25rem] lg:pt-[16.85rem]",
        isBlack ? blackStateClass[visualState] : whiteStateClass[visualState]
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-x-1 top-2 rounded-full transition-opacity group-active:opacity-100",
          isPressed ? "opacity-0" : "opacity-70",
          isBlack ? "h-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" : "h-20 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)]"
        ].join(" ")}
      />
      {keyboardKey && (
        <span
          className={[
            "absolute left-1/2 grid -translate-x-1/2 place-items-center rounded-md border px-1 font-mono text-[0.65rem] font-black shadow-sm",
            isBlack
              ? "top-4 h-6 min-w-6 border-white/10 bg-white/10 text-zinc-300"
              : "bottom-14 h-7 min-w-7 border-zinc-300 bg-zinc-100/90 text-zinc-500 md:bottom-16"
          ].join(" ")}
        >
          {keyboardKey}
        </span>
      )}
      <span className={isBlack ? "relative z-10 text-[0.72rem] text-zinc-200" : "relative z-10 tracking-tight"}>{noteId}</span>
    </motion.button>
  );
};