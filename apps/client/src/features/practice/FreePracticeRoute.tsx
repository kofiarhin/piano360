import { useState } from "react";

import { VirtualPiano, defaultKeyboardRange } from "../piano/VirtualPiano";
import type { PianoKeyModel } from "../piano/pianoTypes";

export const FreePracticeRoute = () => {
  const [selectedKey, setSelectedKey] = useState<PianoKeyModel | undefined>();
  const [showLabels, setShowLabels] = useState(true);
  const [showHints, setShowHints] = useState(true);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Free practice</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Explore around middle C</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-2 font-bold">
            <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
            Labels
          </label>
          <label className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-2 font-bold">
            <input type="checkbox" checked={showHints} onChange={(event) => setShowHints(event.target.checked)} />
            Hints
          </label>
        </div>
      </section>

      <VirtualPiano
        range={defaultKeyboardRange}
        showLabels={showLabels}
        showHints={showHints}
        onKeyPress={setSelectedKey}
        activeNoteIds={selectedKey ? [selectedKey.noteId] : []}
      />

      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10" aria-live="polite">
        <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Selected key</p>
        {selectedKey ? (
          <dl className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <dt className="text-sm text-ink/60">Note</dt>
              <dd className="text-2xl font-black">{selectedKey.noteName}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/60">Octave</dt>
              <dd className="text-2xl font-black">{selectedKey.octave}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/60">Key type</dt>
              <dd className="text-2xl font-black">{selectedKey.keyType}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/60">Label</dt>
              <dd className="text-2xl font-black">{selectedKey.displayLabel}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-ink/70">Tap or click a key to inspect it.</p>
        )}
      </section>
    </div>
  );
};
