import { motion } from "framer-motion";

import type { FeedbackKind, NoteId, NoteResult } from "../practiceTypes";

type NoteCardProps = {
  noteId: NoteId;
  index: number;
  currentIndex: number;
  result: NoteResult;
  feedback: FeedbackKind;
};

const noteParts = (noteId: NoteId) => {
  const match = noteId.match(/^([A-G]#?)(\d)$/);
  return {
    name: match?.[1] ?? noteId,
    octave: match?.[2] ?? ""
  };
};

export const NoteCard = ({ noteId, index, currentIndex, result, feedback }: NoteCardProps) => {
  const isCurrent = index === currentIndex;
  const isPast = index < currentIndex;
  const { name, octave } = noteParts(noteId);
  const activeWrong = isCurrent && feedback === "wrong";
  const activeCorrect = isCurrent && result === "correct";
  const missed = result === "missed";

  return (
    <motion.div
      layout
      data-testid={`note-card-${index}`}
      animate={{
        opacity: missed ? 0.38 : isPast ? 0.48 : 1,
        scale: isCurrent ? 1.12 : isPast ? 0.88 : 0.96,
        y: isCurrent ? -8 : 0
      }}
      transition={{ type: "spring", stiffness: 170, damping: 22 }}
      className={[
        "relative flex h-36 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border text-center shadow-2xl md:h-40 md:w-28",
        isCurrent
          ? "border-violet-300/70 bg-violet-500/20 shadow-[0_24px_70px_-32px_rgba(139,92,246,0.95)]"
          : "border-white/10 bg-zinc-900/80 shadow-black/20",
        activeCorrect ? "border-emerald-300/70 bg-emerald-500/20" : "",
        activeWrong ? "border-rose-300/70 bg-rose-500/20" : "",
        missed ? "border-rose-300/30 bg-rose-950/20" : ""
      ].join(" ")}
    >
      {isPast && result === "correct" && (
        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]" />
      )}
      {missed && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-400/80" />}
      <span className="text-5xl font-black leading-none text-white md:text-6xl">{name}</span>
      <span className="-mt-1 font-mono text-lg font-bold text-zinc-400">{octave}</span>
      {isCurrent && (
        <motion.span
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.35, repeat: Infinity }}
          className="absolute -bottom-9 text-xs font-black uppercase text-violet-200"
        >
          PRESS NOW
        </motion.span>
      )}
    </motion.div>
  );
};
