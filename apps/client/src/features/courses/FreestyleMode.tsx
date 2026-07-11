import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { playNote } from "../../audio/NotePlayer";
import { MobileLandscapeShell, useMobileLandscapeMode } from "../../shared/MobileLandscapeShell";
import { SiteHeader } from "../../shared/SiteHeader";
import { CoursePiano, type PianoInputSource } from "./CoursePiano";
import { keyboardMap } from "./courseKeyboard";
import type { NoteId } from "./courseTypes";
import { identifyFreestyleChord } from "./freestyleChords";

type FreestyleInputSource = PianoInputSource | `key:${string}`;

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));
};

const heldNotesFromSources = (sources: Map<NoteId, Set<FreestyleInputSource>>) => [
  ...sources.keys()
];

export const FreestyleMode = () => {
  const mobileLandscapeActive = useMobileLandscapeMode();
  const heldSourcesRef = useRef(new Map<NoteId, Set<FreestyleInputSource>>());
  const [heldNotes, setHeldNotes] = useState<NoteId[]>([]);
  const [lastPlayedNotes, setLastPlayedNotes] = useState<NoteId[]>([]);

  const syncHeldNotes = useCallback(() => {
    const nextHeldNotes = heldNotesFromSources(heldSourcesRef.current);
    setHeldNotes(nextHeldNotes);
    return nextHeldNotes;
  }, []);

  const pressNote = useCallback(
    (noteId: NoteId, source: FreestyleInputSource) => {
      const currentSources = heldSourcesRef.current.get(noteId) ?? new Set<FreestyleInputSource>();
      if (currentSources.has(source)) {
        return;
      }

      currentSources.add(source);
      heldSourcesRef.current.set(noteId, currentSources);
      setLastPlayedNotes(syncHeldNotes());
      playNote(noteId);
    },
    [syncHeldNotes]
  );

  const releaseNote = useCallback(
    (noteId: NoteId, source: FreestyleInputSource) => {
      const currentSources = heldSourcesRef.current.get(noteId);
      if (!currentSources) {
        return;
      }

      currentSources.delete(source);
      if (currentSources.size === 0) {
        heldSourcesRef.current.delete(noteId);
      }

      syncHeldNotes();
    },
    [syncHeldNotes]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const noteId = keyboardMap[key];
      if (!noteId) {
        return;
      }

      event.preventDefault();
      pressNote(noteId, `key:${key}`);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const noteId = keyboardMap[key];
      if (!noteId) {
        return;
      }

      event.preventDefault();
      releaseNote(noteId, `key:${key}`);
    };

    const clearHeldNotes = () => {
      heldSourcesRef.current.clear();
      syncHeldNotes();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearHeldNotes);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearHeldNotes);
    };
  }, [pressNote, releaseNote, syncHeldNotes]);

  const chord = useMemo(() => identifyFreestyleChord(lastPlayedNotes), [lastPlayedNotes]);
  const lastPlayedDisplay =
    lastPlayedNotes.length > 0 ? lastPlayedNotes.join(" + ") : "Press any key";

  return (
    <MobileLandscapeShell
      active={mobileLandscapeActive}
      className="freestyle-mode-page bg-[#12110f] text-stone-100"
      testId="freestyle-mode-shell"
    >
      <SiteHeader />

      <main className="freestyle-mode-main min-h-[100dvh] bg-[#12110f] text-stone-100">
        <div className="freestyle-mode-workspace mx-auto grid w-full min-w-0 max-w-7xl gap-4 px-4 py-4 md:px-6 lg:py-6">
          <nav className="freestyle-mode-nav flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                className="font-bold text-amber-100 underline-offset-4 hover:underline"
                to="/courses"
              >
                Course catalogue
              </Link>
              <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-white">
                Freestyle Mode
              </h1>
            </div>
          </nav>

          <section
            aria-label="Freestyle instruction"
            className="freestyle-mode-instruction grid min-w-0 gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center"
          >
            <div className="grid justify-items-center gap-2">
              <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-violet-200/85">
                Freestyle
              </p>
              <p
                aria-label="Freestyle live notes"
                aria-live="polite"
                className="freestyle-mode-live-notes max-w-full break-words font-mono text-4xl font-black leading-tight tracking-normal text-white sm:text-6xl"
              >
                {lastPlayedDisplay}
              </p>
            </div>

            {chord ? (
              <div
                aria-live="polite"
                className="mx-auto grid w-full max-w-3xl gap-2 sm:grid-cols-3"
              >
                <div className="rounded-lg border border-violet-200/25 bg-violet-950/35 px-3 py-2">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-violet-100/75">
                    Chord
                  </p>
                  <p className="mt-1 text-lg font-black text-violet-50">{chord.name}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-stone-950/70 px-3 py-2">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                    Quality
                  </p>
                  <p className="mt-1 text-lg font-black text-stone-100">{chord.quality}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-stone-950/70 px-3 py-2">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                    Inversion
                  </p>
                  <p className="mt-1 text-lg font-black text-stone-100">{chord.inversion}</p>
                </div>
              </div>
            ) : null}
          </section>

          <CoursePiano
            className="freestyle-mode-piano"
            targetNotes={[]}
            activeNotes={heldNotes}
            activeVariant="freestyle"
            fitToContainer={mobileLandscapeActive}
            onInput={() => undefined}
            onPress={pressNote}
            onRelease={releaseNote}
          />
        </div>
      </main>
    </MobileLandscapeShell>
  );
};
