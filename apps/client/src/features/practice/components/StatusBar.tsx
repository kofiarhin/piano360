import type { AudioStatus } from "../../../audio/AudioEngine";
import type { FeedbackKind, NoteId, PracticeMode } from "../practiceTypes";

type StatusBarProps = {
  mode: PracticeMode;
  feedback: FeedbackKind;
  currentNote?: NoteId;
  lastPlayedNote?: NoteId;
  audioStatus: AudioStatus;
  correct: number;
  missed: number;
};

const feedbackText: Record<FeedbackKind, string> = {
  idle: "Keep going.",
  correct: "Good.",
  wrong: "Wrong key.",
  missed: "Missed note."
};

export const StatusBar = ({ mode, feedback, currentNote, lastPlayedNote, audioStatus, correct, missed }: StatusBarProps) => {
  const note = mode === "freestyle" ? lastPlayedNote : currentNote;

  return (
    <section className="grid gap-3 md:grid-cols-[1fr_1.2fr_1fr]">
      <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <p className="text-xs font-black uppercase text-zinc-500">Input</p>
        <p className="mt-2 text-lg font-black text-white">{audioStatus === "unavailable" ? "Audio unavailable" : "Listening"}</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <p className="text-xs font-black uppercase text-zinc-500">{mode === "freestyle" ? "Mode" : "Feedback"}</p>
        <p className="mt-2 text-lg font-black text-white">{mode === "freestyle" ? "Freestyle" : feedbackText[feedback]}</p>
        {mode === "practice" && (
          <p className="mt-1 text-xs font-semibold text-zinc-500">
            <span data-testid="correct-count">{correct}</span> correct / <span data-testid="missed-count">{missed}</span> missed
          </p>
        )}
      </article>
      <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <p className="text-xs font-black uppercase text-zinc-500">Current Note</p>
        <p data-testid="current-note" className="mt-2 font-mono text-3xl font-black text-white">
          {note ?? "--"}
        </p>
      </article>
    </section>
  );
};
