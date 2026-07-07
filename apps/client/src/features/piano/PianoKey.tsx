import type { PianoKeyModel } from "./pianoTypes";

type PianoKeyProps = {
  pianoKey: PianoKeyModel;
  showLabels: boolean;
  showHints: boolean;
  onPress?: (key: PianoKeyModel) => void;
};

const handLabel = {
  left: "LH",
  right: "RH",
  both: "Both"
};

export const getPianoKeyAriaLabel = (key: PianoKeyModel) => {
  const parts = [`${key.displayLabel}`, `${key.keyType} key`];

  if (key.hand && key.finger) {
    parts.push(`${key.hand} hand finger ${key.finger}`);
  }

  if (key.isTarget) {
    parts.push("target note");
  }

  return parts.join(", ");
};

export const PianoKey = ({ pianoKey, showLabels, showHints, onPress }: PianoKeyProps) => {
  const isBlack = pianoKey.keyType === "black";
  const targetClasses = pianoKey.isTarget
    ? "ring-4 ring-clay/70 ring-offset-2 ring-offset-paper"
    : "ring-1 ring-ink/10";
  const activeClasses =
    pianoKey.highlightState === "correct" ? "bg-moss text-white" : isBlack ? "bg-ink text-white" : "bg-white";

  return (
    <button
      type="button"
      aria-label={getPianoKeyAriaLabel(pianoKey)}
      data-note-id={pianoKey.noteId}
      data-target={pianoKey.isTarget ? "true" : "false"}
      onClick={() => onPress?.(pianoKey)}
      className={[
        "relative shrink-0 rounded-b-md border border-ink/15 text-center shadow-sm transition active:translate-y-0.5",
        "focus-visible:z-10",
        isBlack ? "h-32 w-9 -mx-2.5 z-[1] pt-14 text-xs" : "h-48 w-14 pt-28 text-sm",
        targetClasses,
        activeClasses
      ].join(" ")}
    >
      {showHints && pianoKey.hand && pianoKey.finger && (
        <span className="absolute left-1/2 top-3 flex -translate-x-1/2 flex-col items-center gap-1">
          <span className="rounded-full bg-clay px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
            {handLabel[pianoKey.hand]}
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-ink shadow-sm">
            {pianoKey.finger}
          </span>
        </span>
      )}
      {showLabels && <span className="font-bold">{pianoKey.displayLabel}</span>}
    </button>
  );
};
