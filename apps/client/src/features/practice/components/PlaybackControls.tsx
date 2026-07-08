type PlaybackControlsProps = {
  isPlaying: boolean;
  canStep: boolean;
  tempo: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTempoChange: (tempo: number) => void;
};

export const PlaybackControls = ({
  isPlaying,
  canStep,
  tempo,
  onPlayPause,
  onPrevious,
  onNext,
  onTempoChange
}: PlaybackControlsProps) => (
  <div className="flex flex-wrap items-center justify-end gap-2">
    <button
      type="button"
      onClick={onPrevious}
      disabled={!canStep}
      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
    >
      Previous
    </button>
    <button
      type="button"
      aria-label={isPlaying ? "Pause" : "Play"}
      onClick={onPlayPause}
      className="min-w-24 rounded-full bg-violet-500 px-5 py-2 text-sm font-bold text-white shadow-[0_16px_38px_-20px_rgba(139,92,246,0.95)] transition hover:bg-violet-400 active:scale-[0.98]"
    >
      {isPlaying ? "Pause" : "Play"}
    </button>
    <button
      type="button"
      onClick={onNext}
      disabled={!canStep}
      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
    >
      Next
    </button>
    <label className="ml-0 flex min-w-52 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 md:ml-2">
      <span className="font-semibold">Tempo</span>
      <input
        aria-label="Tempo"
        type="range"
        min="60"
        max="180"
        step="5"
        value={tempo}
        onChange={(event) => onTempoChange(Number(event.target.value))}
        className="w-28 accent-violet-500"
      />
      <output className="w-10 text-right font-mono text-xs text-zinc-400">{tempo}</output>
    </label>
  </div>
);
