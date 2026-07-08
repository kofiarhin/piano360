import { motion } from "framer-motion";

import type { FeedbackKind, NoteId, NoteResult } from "../practiceTypes";
import { CompletionSummary } from "./CompletionSummary";
import { NoteCard } from "./NoteCard";
import { PracticeProgress } from "./PracticeProgress";

const CARD_SPACING = 142;
const CARD_WIDTH = 112;

type NoteHighwayProps = {
  notes: NoteId[];
  currentIndex: number;
  progressBeats: number;
  results: NoteResult[];
  feedback: FeedbackKind;
  isComplete: boolean;
  correct: number;
  missed: number;
  tempo: number;
  measureCount: number;
  onPracticeAgain: () => void;
  onFreestyle: () => void;
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.max(0, Math.round(seconds % 60));
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
};

export const NoteHighway = ({
  notes,
  currentIndex,
  progressBeats,
  results,
  feedback,
  isComplete,
  correct,
  missed,
  tempo,
  measureCount,
  onPracticeAgain,
  onFreestyle
}: NoteHighwayProps) => {
  const total = notes.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const progress = Math.min(100, (progressBeats / total) * 100);
  const secondsPerBeat = 60 / tempo;
  const measure = Math.min(measureCount, Math.max(1, Math.floor(currentIndex / 4) + 1));

  return (
    <section className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-zinc-950/70 px-3 py-3 shadow-[0_20px_70px_-56px_rgba(0,0,0,0.95)] md:px-4 md:py-3">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/35 to-transparent" />
      {isComplete ? (
        <CompletionSummary
          total={total}
          correct={correct}
          missed={missed}
          accuracy={accuracy}
          onPracticeAgain={onPracticeAgain}
          onFreestyle={onFreestyle}
        />
      ) : (
        <>
          <div className="relative mx-auto h-36 max-w-6xl overflow-hidden rounded-[1rem] border border-white/[0.07] bg-[#09090d] md:h-40">
            <div className="absolute inset-y-0 left-1/2 w-px bg-violet-200/70 shadow-[0_0_28px_rgba(139,92,246,0.58)]" />
            <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-[0.62rem] font-black uppercase text-violet-100">
              Playhead
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#09090d] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#09090d] to-transparent" />
            <motion.div
              className="absolute top-8 flex items-center gap-6"
              style={{ left: "50%" }}
              animate={{ x: -CARD_WIDTH / 2 - progressBeats * CARD_SPACING }}
              transition={{ type: "spring", stiffness: 90, damping: 24, mass: 0.7 }}
            >
              {notes.map((note, index) => (
                <NoteCard
                  key={`${note}-${index}`}
                  noteId={note}
                  index={index}
                  currentIndex={currentIndex}
                  result={results[index] ?? "pending"}
                  feedback={feedback}
                />
              ))}
            </motion.div>
          </div>
          <PracticeProgress
            progress={progress}
            measure={measure}
            currentTime={formatTime(progressBeats * secondsPerBeat)}
            totalTime={formatTime(total * secondsPerBeat)}
          />
        </>
      )}
    </section>
  );
};