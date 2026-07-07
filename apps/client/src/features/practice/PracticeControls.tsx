type PracticeControlsProps = {
  canSkip: boolean;
  onCorrect: () => void;
  onTryAgain: () => void;
  onSkip: () => void;
  onRestart: () => void;
};

export const PracticeControls = ({ canSkip, onCorrect, onTryAgain, onSkip, onRestart }: PracticeControlsProps) => (
  <div className="grid gap-3 rounded-lg bg-white p-4 ring-1 ring-ink/10 sm:grid-cols-4">
    <button className="rounded-md bg-moss px-4 py-3 font-black text-white active:translate-y-0.5" type="button" onClick={onCorrect}>
      Correct
    </button>
    <button className="rounded-md bg-paper px-4 py-3 font-black text-ink ring-1 ring-ink/10" type="button" onClick={onTryAgain}>
      Try Again
    </button>
    <button
      className="rounded-md bg-paper px-4 py-3 font-black text-ink ring-1 ring-ink/10 disabled:cursor-not-allowed disabled:opacity-45"
      type="button"
      onClick={onSkip}
      disabled={!canSkip}
    >
      Skip
    </button>
    <button className="rounded-md bg-white px-4 py-3 font-black text-ink ring-1 ring-ink/15" type="button" onClick={onRestart}>
      Restart
    </button>
  </div>
);
