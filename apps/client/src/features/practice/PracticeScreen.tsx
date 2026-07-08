import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getAudioStatus, playNote, subscribeToAudioStatus, warmAudio } from "../../audio/NotePlayer";
import { keyboardMap, practiceSongs } from "./practiceData";
import { FreePlayPanel } from "./components/FreePlayPanel";
import { NoteHighway } from "./components/NoteHighway";
import { PracticeHeader } from "./components/PracticeHeader";
import { StatusBar } from "./components/StatusBar";
import { VirtualPiano } from "./components/VirtualPiano";
import type { FeedbackKind, NoteId, NoteResult, PracticeMode } from "./practiceTypes";
import type { KeyVisualState } from "./components/PianoKey";

const INITIAL_TEMPO = 100;
const TICK_MS = 40;

const createPendingResults = (length: number): NoteResult[] => Array.from({ length }, () => "pending");

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));
};

export const PracticeScreen = () => {
  const [mode, setMode] = useState<PracticeMode>("practice");
  const [selectedSongId, setSelectedSongId] = useState(practiceSongs[0].id);
  const selectedSong = useMemo(
    () => practiceSongs.find((song) => song.id === selectedSongId) ?? practiceSongs[0],
    [selectedSongId]
  );

  const [tempo, setTempo] = useState(INITIAL_TEMPO);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressBeats, setProgressBeats] = useState(0);
  const [results, setResults] = useState<NoteResult[]>(() => createPendingResults(selectedSong.notes.length));
  const [feedback, setFeedback] = useState<FeedbackKind>("idle");
  const [lastPlayedNote, setLastPlayedNote] = useState<NoteId>();
  const [pressedStates, setPressedStates] = useState<Partial<Record<NoteId, KeyVisualState>>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [audioStatus, setAudioStatus] = useState(getAudioStatus());

  const previousIndexRef = useRef(0);
  const manualStepRef = useRef(false);

  const noteCount = selectedSong.notes.length;
  const currentIndex = Math.min(Math.floor(progressBeats), Math.max(0, noteCount - 1));
  const currentNote = isComplete ? undefined : selectedSong.notes[currentIndex];
  const correct = results.filter((result) => result === "correct").length;
  const missed = results.filter((result) => result === "missed").length;

  useEffect(() => {
    warmAudio();
    return subscribeToAudioStatus(setAudioStatus);
  }, []);

  const resetPractice = useCallback((nextNoteCount = selectedSong.notes.length) => {
    setIsPlaying(false);
    setProgressBeats(0);
    setResults(createPendingResults(nextNoteCount));
    setFeedback("idle");
    setPressedStates({});
    setIsComplete(false);
    previousIndexRef.current = 0;
    manualStepRef.current = false;
  }, [selectedSong.notes.length]);

  const flashFeedback = useCallback((kind: FeedbackKind) => {
    setFeedback(kind);

    if (kind === "correct" || kind === "wrong") {
      window.setTimeout(() => {
        setFeedback((current) => (current === kind ? "idle" : current));
      }, 780);
    }
  }, []);

  const flashKey = useCallback((noteId: NoteId, state: KeyVisualState) => {
    setPressedStates((current) => ({ ...current, [noteId]: state }));
    window.setTimeout(() => {
      setPressedStates((current) => {
        const next = { ...current };
        delete next[noteId];
        return next;
      });
    }, 260);
  }, []);

  const handleModeChange = useCallback(
    (nextMode: PracticeMode) => {
      setMode(nextMode);
      setIsPlaying(false);
      setFeedback("idle");

      if (nextMode === "practice" && isComplete) {
        resetPractice();
      }
    },
    [isComplete, resetPractice]
  );

  const handleSongChange = useCallback(
    (songId: string) => {
      const nextSong = practiceSongs.find((song) => song.id === songId) ?? practiceSongs[0];

      setSelectedSongId(nextSong.id);
      resetPractice(nextSong.notes.length);
    },
    [resetPractice]
  );

  const handlePlayPause = useCallback(() => {
    if (mode !== "practice" || isComplete) {
      return;
    }

    warmAudio();
    setIsPlaying((current) => !current);
  }, [isComplete, mode]);

  const handleStep = useCallback(
    (direction: -1 | 1) => {
      if (mode !== "practice") {
        return;
      }

      setIsPlaying(false);
      setFeedback("idle");
      setIsComplete(false);
      manualStepRef.current = true;
      const baseIndex = isComplete ? noteCount - 1 : currentIndex;
      const nextIndex = Math.max(0, Math.min(noteCount - 1, baseIndex + direction));
      previousIndexRef.current = nextIndex;
      setProgressBeats(nextIndex);
    },
    [currentIndex, isComplete, mode, noteCount]
  );

  const handlePianoInput = useCallback(
    (noteId: NoteId) => {
      playNote(noteId);
      setLastPlayedNote(noteId);

      if (mode === "freestyle") {
        flashKey(noteId, "pressed");
        return;
      }

      if (!currentNote || isComplete) {
        flashKey(noteId, "pressed");
        return;
      }

      if (noteId === currentNote) {
        setResults((current) => {
          if (current[currentIndex] === "correct") {
            return current;
          }

          const next = [...current];
          next[currentIndex] = "correct";
          return next;
        });
        flashKey(noteId, "correct");
        flashFeedback("correct");
      } else {
        flashKey(noteId, "wrong");
        flashFeedback("wrong");
      }
    },
    [currentIndex, currentNote, flashFeedback, flashKey, isComplete, mode]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) {
        return;
      }

      const noteId = keyboardMap[event.key.toLowerCase()];

      if (!noteId) {
        return;
      }

      event.preventDefault();
      handlePianoInput(noteId);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePianoInput]);

  useEffect(() => {
    if (!isPlaying || mode !== "practice" || isComplete) {
      return;
    }

    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTick;
      lastTick = now;

      setProgressBeats((current) => Math.min(noteCount, current + elapsed / (60000 / tempo)));
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [isComplete, isPlaying, mode, noteCount, tempo]);

  useEffect(() => {
    if (isComplete || mode !== "practice") {
      return;
    }

    const previousIndex = previousIndexRef.current;

    if (currentIndex > previousIndex && !manualStepRef.current) {
      setResults((current) => {
        const next = [...current];

        for (let index = previousIndex; index < currentIndex; index += 1) {
          if (next[index] === "pending") {
            next[index] = "missed";
          }
        }

        return next;
      });
      flashFeedback("missed");
    }

    previousIndexRef.current = currentIndex;
    manualStepRef.current = false;
  }, [currentIndex, flashFeedback, isComplete, mode]);

  useEffect(() => {
    if (progressBeats < noteCount || isComplete) {
      return;
    }

    setIsPlaying(false);
    setResults((current) => current.map((result) => (result === "pending" ? "missed" : result)));
    setFeedback("idle");
    setIsComplete(true);
  }, [isComplete, noteCount, progressBeats]);

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#0b0b10] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_30%)]" />
      <div className="relative flex min-h-[100dvh] flex-col gap-6 pb-6">
        <PracticeHeader
          songs={practiceSongs}
          selectedSongId={selectedSong.id}
          mode={mode}
          isPlaying={isPlaying}
          isComplete={isComplete}
          tempo={tempo}
          onSongChange={handleSongChange}
          onModeChange={handleModeChange}
          onPlayPause={handlePlayPause}
          onPrevious={() => handleStep(-1)}
          onNext={() => handleStep(1)}
          onTempoChange={setTempo}
        />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 md:px-6">
          {mode === "practice" ? (
            <NoteHighway
              notes={selectedSong.notes}
              currentIndex={currentIndex}
              progressBeats={progressBeats}
              results={results}
              feedback={feedback}
              isComplete={isComplete}
              correct={correct}
              missed={missed}
              tempo={tempo}
              measureCount={selectedSong.measureCount}
              onPracticeAgain={resetPractice}
              onFreestyle={() => handleModeChange("freestyle")}
            />
          ) : (
            <FreePlayPanel lastPlayedNote={lastPlayedNote} />
          )}
          <VirtualPiano currentNote={mode === "practice" ? currentNote : undefined} pressedStates={pressedStates} onPress={handlePianoInput} />
          <StatusBar
            mode={mode}
            feedback={feedback}
            currentNote={currentNote}
            lastPlayedNote={lastPlayedNote}
            audioStatus={audioStatus}
            correct={correct}
            missed={missed}
          />
        </main>
      </div>
    </div>
  );
};
