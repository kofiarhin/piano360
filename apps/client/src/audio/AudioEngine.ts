import type { NoteId } from "../features/practice/practiceTypes";
import { PianoSampler } from "./PianoSampler";

export type AudioStatus = "idle" | "loading" | "ready" | "unavailable";

type PianoSamplerLike = Pick<PianoSampler, "load" | "play">;

type AudioEngineOptions = {
  createSampler?: () => PianoSamplerLike;
};

export class AudioEngine {
  private readonly createSampler: () => PianoSamplerLike;
  private sampler: PianoSamplerLike | undefined;
  private status: AudioStatus = "idle";
  private listeners = new Set<(status: AudioStatus) => void>();
  private loadPromise: Promise<void> | undefined;

  constructor(options: AudioEngineOptions = {}) {
    this.createSampler = options.createSampler ?? (() => new PianoSampler());
  }

  getStatus() {
    return this.status;
  }

  subscribe(listener: (status: AudioStatus) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  warm() {
    this.ensureReady();
  }

  playNote(noteId: NoteId, velocity?: number) {
    this.ensureReady();

    if (!this.sampler || this.status === "unavailable") {
      return false;
    }

    return this.sampler.play(noteId, velocity);
  }

  private ensureReady() {
    if (this.status === "ready" || this.status === "unavailable" || this.loadPromise) {
      return;
    }

    this.initialize();
  }

  private initialize() {
    try {
      this.setStatus("loading");

      const sampler = this.createSampler();
      this.sampler = sampler;
      this.loadPromise = Promise.resolve(sampler.load())
        .then(() => {
          this.setStatus("ready");
        })
        .catch(() => {
          this.setStatus("unavailable");
        })
        .finally(() => {
          this.loadPromise = undefined;
        });
    } catch {
      this.setStatus("unavailable");
    }
  }

  private setStatus(status: AudioStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}
