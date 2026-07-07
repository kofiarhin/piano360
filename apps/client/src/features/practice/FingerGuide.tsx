import type { PracticeStep } from "../../content";

const handText = {
  left: "Left hand",
  right: "Right hand",
  both: "Both hands"
};

export const FingerGuide = ({ step }: { step: PracticeStep }) => (
  <div className="rounded-lg bg-white p-4 ring-1 ring-ink/10">
    <p className="text-sm font-bold uppercase tracking-wide text-ink/60">{handText[step.expectedHand]}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {step.targetNotes.map((target) => (
        <span
          key={`${target.note}${target.octave}-${target.hand}-${target.finger}-${target.role}`}
          className="rounded-full bg-paper px-3 py-2 text-sm font-bold"
        >
          {target.displayLabel}: {target.hand} finger {target.finger}
        </span>
      ))}
    </div>
  </div>
);
