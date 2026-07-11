import { pianoNotes, type NoteId } from "../features/notes";

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

type SafariAudioContextState = AudioContextState | "interrupted";

const publicBaseUrl = import.meta.env.BASE_URL || "/";
const publicAssetBaseUrl = publicBaseUrl.endsWith("/") ? publicBaseUrl : `${publicBaseUrl}/`;

export const sampleUrlFor = (note: NoteId) =>
  `${publicAssetBaseUrl}audio/piano/${sampleFileByNote[note]}`;

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

const decodeAudioBuffer = (audioContext: AudioContext, sampleBytes: ArrayBuffer) =>
  new Promise<AudioBuffer>((resolve, reject) => {
    let settled = false;
    const finish = (buffer: AudioBuffer) => {
      if (!settled) {
        settled = true;
        resolve(buffer);
      }
    };
    const fail = (error: unknown) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    try {
      const decodePromise = audioContext.decodeAudioData(sampleBytes.slice(0), finish, fail);
      void decodePromise?.then(finish, fail);
    } catch (error) {
      fail(error);
    }
  });

const isPrimaryAudioPointer = (event: PointerEvent) =>
  event.pointerType === "" ||
  event.pointerType === "mouse" ||
  event.pointerType === "touch" ||
  event.pointerType === "pen";

const isAudioContextRunning = (audioContext: AudioContext | undefined) =>
  audioContext !== undefined && (audioContext.state as SafariAudioContextState) === "running";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class PianoSampler {
  private audioContext: AudioContext | undefined;
  private buffers = new Map<NoteId, AudioBuffer>();
  private loadPromise: Promise<void> | undefined;
  private unlockPromise: Promise<void> | undefined;
  private hasCompletedGestureUnlock = false;
  private unlockListeners: Array<() => void> = [];

  private setupGlobalUnlockListeners() {
    if (this.unlockListeners.length > 0) return;

    const unlockHandler = () => {
      void this.unlock().catch(() => undefined);
    };

    const events = ["pointerdown", "mousedown", "keydown"] as const;
    events.forEach((eventType) => {
      const handler = (e: Event) => {
        if (eventType !== "pointerdown" || isPrimaryAudioPointer(e as PointerEvent)) {
          unlockHandler();
        }
      };
      document.addEventListener(eventType, handler, { once: false, passive: true });
      this.unlockListeners.push(() => document.removeEventListener(eventType, handler));
    });
  }

  load() {
    if (typeof window === "undefined" || typeof fetch === "undefined") {
      return Promise.reject(new Error("Web Audio is unavailable."));
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.audioContext = this.audioContext ?? createLowLatencyAudioContext();
    this.setupGlobalUnlockListeners();

    const missingNotes = pianoNotes.filter((noteId) => !this.buffers.has(noteId));

    if (missingNotes.length === 0) {
      return Promise.resolve();
    }

    this.loadPromise = Promise.allSettled(
      missingNotes.map(async (noteId) => {
        const response = await fetch(sampleUrlFor(noteId));

        if (!response.ok) {
          throw new Error(`Could not load piano sample: ${sampleFileByNote[noteId]}`);
        }

        const sampleBytes = await response.arrayBuffer();
        const buffer = await decodeAudioBuffer(this.audioContext!, sampleBytes);
        this.buffers.set(noteId, buffer);
      })
    )
      .then((results) => {
        const failedLoad = results.find((result) => result.status === "rejected");

        if (failedLoad?.status === "rejected") {
          throw failedLoad.reason;
        }
      })
      .then(() => undefined)
      .finally(() => {
        this.loadPromise = undefined;
      });

    return this.loadPromise;
  }

  async unlock() {
    this.audioContext = this.audioContext ?? createLowLatencyAudioContext();
    this.setupGlobalUnlockListeners();

    if (this.hasCompletedGestureUnlock && this.audioContext.state === "running") {
      return;
    }

    if (!this.unlockPromise) {
      this.unlockPromise = this.forceGestureUnlock()
        .then(() => {
          this.hasCompletedGestureUnlock = isAudioContextRunning(this.audioContext);
          if (this.hasCompletedGestureUnlock) {
            this.removeGlobalUnlockListeners();
          }
        })
        .catch((error) => {
          this.hasCompletedGestureUnlock = false;
          console.warn("Audio unlock failed:", error);
          throw error;
        })
        .finally(() => {
          this.unlockPromise = undefined;
        });
    }

    await this.unlockPromise;
  }

  async play(noteId: NoteId, velocity = 0.92) {
    const unlockPromise = this.unlock();
    void this.load().catch(() => undefined);

    const audioContext = this.audioContext;

    if (!audioContext || audioContext.state === "closed") {
      await unlockPromise;
      return false;
    }

    if (!isAudioContextRunning(audioContext)) {
      await unlockPromise;
    }

    if (!isAudioContextRunning(audioContext)) {
      console.warn(`AudioContext not running for note ${noteId}: ${audioContext.state}`);
      return false;
    }

    const buffer = this.buffers.get(noteId);

    if (buffer) {
      this.playSampleBuffer(audioContext, buffer, velocity);
    } else {
      this.playFallbackTone(noteId, velocity);
    }

    return true;
  }

  dispose() {
    this.removeGlobalUnlockListeners();
  }

  private removeGlobalUnlockListeners() {
    this.unlockListeners.forEach((cleanup) => cleanup());
    this.unlockListeners = [];
  }

  private playSampleBuffer(audioContext: AudioContext, buffer: AudioBuffer, velocity: number) {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(clampVelocity(velocity), audioContext.currentTime);
    source.connect(gain).connect(audioContext.destination);
    source.start(audioContext.currentTime);
  }

  private async forceGestureUnlock() {
    const audioContext = this.audioContext;

    if (!audioContext || audioContext.state === "closed") {
      return;
    }

    const audioState = audioContext.state as SafariAudioContextState;
    const resumePromise =
      audioState === "suspended" || audioState === "interrupted"
        ? audioContext.resume().catch((e) => {
            console.warn("Resume failed:", e);
            return undefined;
          })
        : Promise.resolve();

    try {
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      const durationSeconds = 0.05;
      const frameCount = Math.max(1, Math.ceil(audioContext.sampleRate * durationSeconds));
      const silentBuffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);

      source.buffer = silentBuffer;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      source.connect(gain).connect(audioContext.destination);
      source.start(audioContext.currentTime);
      source.stop(audioContext.currentTime + durationSeconds);
      source.onended = () => {
        try {
          source.disconnect();
          gain.disconnect();
        } catch {
          // Some mobile Web Audio implementations throw if a node is already disconnected.
        }
      };
    } catch {
      this.primeMobileAudioUnlock();
    }

    await resumePromise;
  }

  private primeMobileAudioUnlock() {
    const audioContext = this.audioContext;

    if (!audioContext || audioContext.state === "closed") {
      return;
    }

    try {
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      const silentBuffer = audioContext.createBuffer(1, 1, Math.max(1, audioContext.sampleRate));

      source.buffer = silentBuffer;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      source.connect(gain).connect(audioContext.destination);
      source.start(audioContext.currentTime);
      source.stop(audioContext.currentTime + 0.03);
      source.onended = () => {
        try {
          source.disconnect();
          gain.disconnect();
        } catch {
          // Some mobile Web Audio implementations throw if a node is already disconnected.
        }
      };
    } catch {
      // The fallback note path can still play if the browser allows resume without priming.
    }
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
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, clampVelocity(velocity) * 0.18),
      now + 0.01
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }
}
