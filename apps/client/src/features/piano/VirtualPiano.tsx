import { buildKeyboardKeys } from "./keyboardLayout";
import { PianoKey } from "./PianoKey";
import type { VirtualPianoProps } from "./pianoTypes";

export const defaultKeyboardRange = {
  startNote: "C",
  startOctave: 3,
  endNote: "C",
  endOctave: 5
} as const;

export const VirtualPiano = ({
  range,
  targetNotes = [],
  activeNoteIds = [],
  showLabels = true,
  showHints = true,
  onKeyPress,
  className = ""
}: VirtualPianoProps) => {
  const keys = buildKeyboardKeys(range, targetNotes, activeNoteIds);

  return (
    <section className={className} aria-label="Virtual piano">
      <div className="piano-scrollbar overflow-x-auto overscroll-x-contain rounded-lg border border-ink/15 bg-[#d8c8b9] p-3 shadow-inner">
        <div className="flex min-w-max items-start justify-center px-2 pb-3 pt-4" role="group" aria-label="Keyboard keys">
          {keys.map((key) => (
            <PianoKey
              key={key.noteId}
              pianoKey={key}
              showHints={showHints}
              showLabels={showLabels}
              onPress={onKeyPress}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
