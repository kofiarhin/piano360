import { tempoFromPercent } from "./timelineMath";

const tempoOptions = [50, 60, 70, 80, 90, 100];

type TempoControlProps = {
  originalBpm: number;
  percent: number;
  disabled: boolean;
  onChange: (percent: number) => void;
};

export const TempoControl = ({ originalBpm, percent, disabled, onChange }: TempoControlProps) => (
  <label className="grid min-w-36 gap-1 text-left">
    <span className="text-xs font-bold text-stone-400">Practice tempo</span>
    <select
      aria-label="Practice tempo"
      value={percent}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className="min-h-11 rounded-md border border-white/15 bg-stone-900 px-3 font-mono font-bold text-stone-100"
    >
      {tempoOptions.map((option) => (
        <option key={option} value={option}>
          {option}% · {tempoFromPercent(originalBpm, option)} BPM
        </option>
      ))}
    </select>
  </label>
);
