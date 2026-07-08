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

const frequencyByNote: Record<NoteId, number> = {
  A3: 220,
  "A#3": 233.08,
  B3: 246.94,
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392,
  "G#4": 415.3,
  A4: 440,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25
};

const sampleUrlFor = (note: NoteId) => `/audio/piano/${sampleFileByNote[note]}`;
const clampVelocity = (velocity: number) => Math.min(1, Math.max(0, velocity));
const getAudioContextConstructor = () => window.AudioContext ?? window.webkitAudioContext;

const createLowLatencyAudioContext = () => {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) {
    throw new Error("AudioContext is unavailable.");
  }

  try {
    return new AudioContextConstructor({ latencyHint: "interactive" });
  } catch {
    return new AudioContextConstructor();
  }
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class PianoSampler {
  private audioContext: AudioContext | undefined;
  private buffers = new Map<NoteId, AudioBuffer>();
  private loadPromise: Promise<void> | undefined;

  load() {
    if (typeof window === "undefined" || typeof fetch === "undefined") {
      return Promise.reject(new Error("Web Audio is unavailable."));
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.audioContext = this.audioContext ?? createLowLatencyAudioContext();

    this.loadPromise = Promise.all(
      pianoNotes.map(async (noteId) => {
        const response = await fetch(sampleUrlFor(noteId));

        if (!response.ok) {
          throw new Error(`Could not load piano sample: ${sampleFileByNote[noteId]}`);
        }

        const sampleBytes = await response.arrayBuffer();
        const buffer = await this.audioContext!.decodeAudioData(sampleBytes.slice(0));
        this.buffers.set(noteId, buffer);
      })
    ).then(() => undefined);

    return this.loadPromise;
  }

  async unlock() {
    this.audioContext = this.audioContext ?? createLowLatencyAudioContext();

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  play(noteId: NoteId, velocity = 0.92) {
    const audioContext = this.audioContext;

    if (!audioContext) {
      void this.load().catch(() => undefined);
      return false;
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const buffer = this.buffers.get(noteId);

    if (!buffer) {
      void this.load().catch(() => undefined);
      this.playFallbackTone(noteId, velocity);
      return true;
    }

    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(clampVelocity(velocity), audioContext.currentTime);
    source.connect(gain).connect(audioContext.destination);
    source.start(audioContext.currentTime);
    return true;
  }

  private playFallbackTone(noteId: NoteId, velocity: number) {
    const audioContext = this.audioContext;

    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequencyByNote[noteId], now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, clampVelocity(velocity) * 0.18), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }
}