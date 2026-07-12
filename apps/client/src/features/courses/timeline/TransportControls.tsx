type TransportControlsProps = {
  isPlaying: boolean;
  currentBeat: number;
  totalBeats: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSeek: (beat: number) => void;
};

export const TransportControls = ({
  isPlaying,
  currentBeat,
  totalBeats,
  onPlay,
  onPause,
  onRestart,
  onSeek
}: TransportControlsProps) => (
  <div className="grid min-w-0 flex-1 gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={isPlaying ? onPause : onPlay}
        className="min-h-11 min-w-24 rounded-md bg-amber-200 px-4 font-black text-stone-950 transition active:translate-y-px"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="min-h-11 rounded-md border border-white/15 px-4 font-bold text-stone-100 transition active:translate-y-px"
      >
        Restart
      </button>
      <span className="font-mono text-sm font-bold text-stone-300">
        Beat {Math.max(0, currentBeat).toFixed(1)} / {totalBeats}
      </span>
    </div>
    <input
      aria-label="Seek through lesson"
      type="range"
      min="0"
      max={totalBeats}
      step="0.125"
      value={Math.max(0, currentBeat)}
      disabled={isPlaying}
      onChange={(event) => onSeek(Number(event.target.value))}
      className="w-full accent-amber-300"
    />
  </div>
);
