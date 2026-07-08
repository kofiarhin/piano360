import type { PracticeMode } from "../practiceTypes";

type ModeSwitchProps = {
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
};

export const ModeSwitch = ({ mode, onModeChange }: ModeSwitchProps) => (
  <div className="grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
    {(["practice", "freestyle"] as const).map((item) => (
      <button
        key={item}
        type="button"
        aria-label={`${item === "practice" ? "Practice" : "Freestyle"} mode`}
        aria-pressed={mode === item}
        onClick={() => onModeChange(item)}
        className={[
          "rounded-full px-4 py-2 text-sm font-semibold capitalize transition active:scale-[0.98]",
          mode === item ? "bg-violet-500 text-white shadow-[0_10px_30px_-16px_rgba(139,92,246,0.9)]" : "text-zinc-400 hover:text-white"
        ].join(" ")}
      >
        {item}
      </button>
    ))}
  </div>
);
