import type { NoteId } from "../features/practice/practiceTypes";
import { PianoSampler } from "./PianoSampler";

export type AudioStatus = "idle" | "loading" | "ready" | "unavailable";

type PianoSamplerLike = Pick<PianoSampler, "load" | "play" | "unlock">;

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
    const sampler = this.ensureSampler();

    if (!sampler) {
      return;
    }

    void Promise.resolve(sampler.unlock()).catch(() => undefined);
    this.startLoading(sampler);
  }

  playNote(noteId: NoteId, velocity?: number) {
    const sampler = this.ensureSampler();

    if (!sampler) {
      return false;
    }

    this.startLoading(sampler);
    void Promise.resolve(sampler.play(noteId, velocity)).catch(() => undefined);
    return true;
  }

  private ensureSampler() {
    if (this.sampler && this.status !== "unavailable") {
      return this.sampler;
    }

    try {
      this.sampler = this.createSampler();
      return this.sampler;
    } catch {
      this.sampler = undefined;
      this.loadPromise = undefined;
      this.setStatus("unavailable");
      return undefined;
    }
  }

  private startLoading(sampler: PianoSamplerLike) {
    if (this.status === "ready" || this.status === "loading" || this.loadPromise) {
      return;
    }

    try {
      this.setStatus("loading");

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
      this.loadPromise = undefined;
      this.setStatus("unavailable");
    }
  }

  private setStatus(status: AudioStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}
