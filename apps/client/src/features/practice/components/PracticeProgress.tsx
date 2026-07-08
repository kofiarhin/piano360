type PracticeProgressProps = {
  progress: number;
  measure: number;
  currentTime: string;
  totalTime: string;
};

export const PracticeProgress = ({
  progress,
  measure,
  currentTime,
  totalTime
}: PracticeProgressProps) => (
  <div className="practice-progress mx-auto mt-1 w-full max-w-5xl">
    <div className="mb-1 flex items-center justify-between text-[0.65rem] font-bold uppercase text-zinc-500">
      <span>Measure {measure}</span>
      <span>
        {currentTime} / {totalTime}
      </span>
    </div>
    <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-violet-500 shadow-[0_0_18px_rgba(139,92,246,0.28)] transition-[width] duration-200"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  </div>
);
