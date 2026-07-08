type CompletionSummaryProps = {
  total: number;
  correct: number;
  missed: number;
  accuracy: number;
  onPracticeAgain: () => void;
  onFreestyle: () => void;
};

export const CompletionSummary = ({
  total,
  correct,
  missed,
  accuracy,
  onPracticeAgain,
  onFreestyle
}: CompletionSummaryProps) => (
  <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-zinc-900/80 p-8 text-center shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)]">
    <div className="grid h-12 w-12 place-items-center rounded-full border border-emerald-300/30 bg-emerald-400/15 text-lg font-black text-emerald-200">
      OK
    </div>
    <div>
      <p className="text-sm font-black uppercase text-violet-200">Practice Complete</p>
      <h2 className="mt-2 text-3xl font-black text-white md:text-5xl">Practice Complete</h2>
    </div>
    <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
      {[
        ["Total Notes", total],
        ["Correct", correct],
        ["Missed", missed],
        ["Accuracy", `${accuracy}%`]
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
          <p className="mt-2 font-mono text-2xl font-black text-white">{value}</p>
        </div>
      ))}
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={onPracticeAgain}
        className="rounded-full bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 active:scale-[0.98]"
      >
        Practice Again
      </button>
      <button
        type="button"
        onClick={onFreestyle}
        className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08] active:scale-[0.98]"
      >
        Freestyle
      </button>
    </div>
  </div>
);
