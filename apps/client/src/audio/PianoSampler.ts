import { pianoNotes } from "../features/practice/practiceData";
import type { NoteId } from "../features/practice/practiceTypes";

export const sampleFileByNote: Record<NoteId, string> = {
  A3: "A3.mp3",
  "A#3": "Bb3.mp3",
  B3: "B3.mp3",
  C4: "C4.mp3",
  "C#4": "Db4.mp3",
  D4: "D4.mp3",
  "D#4": "Eb4.mp3",
  E4: "E4.mp3",
  F4: "F4.mp3",
  "F#4": "Gb4.mp3",
  G4: "G4.mp3",
  "G#4": "Ab4.mp3",
  A4: "A4.mp3",
  "A#4": "Bb4.mp3",
  B4: "B4.mp3",
  C5: "C5.mp3"
};

const sampleUrlFor = (note: NoteId) => `/audio/piano/${sampleFileByNote[note]}`;
const clampVelocity = (velocity: number) => Math.min(1, Math.max(0, velocity));

export class PianoSampler {
  private sampleUrls = new Map<NoteId, string>();
  private activePlayers = new Set<HTMLAudioElement>();

  load() {
    if (typeof Audio === "undefined") {
      return;
    }

    pianoNotes.forEach((noteId) => {
      const sampleUrl = sampleUrlFor(noteId);
      const sample = new Audio(sampleUrl);
      sample.preload = "auto";
      sample.load();
      this.sampleUrls.set(noteId, sampleUrl);
    });
  }

  play(noteId: NoteId, velocity = 0.86) {
    if (typeof Audio === "undefined") {
      return false;
    }

    const player = new Audio(this.sampleUrls.get(noteId) ?? sampleUrlFor(noteId));
    const cleanup = () => {
      this.activePlayers.delete(player);
    };

    try {
      player.volume = clampVelocity(velocity);
      player.addEventListener("ended", cleanup, { once: true });
      player.addEventListener("error", cleanup, { once: true });
      this.activePlayers.add(player);
      void player.play().catch(cleanup);
      return true;
    } catch {
      cleanup();
      return false;
    }
  }
}
