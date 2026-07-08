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
    return this.ensureReady();
  }

  playNote(noteId: NoteId, velocity?: number) {
    const status = this.ensureReady();

    if (status !== "ready") {
      return false;
    }

    const played = this.sampler?.play(noteId, velocity) ?? false;
    return played;
  }

  private ensureReady() {
    if (this.status === "ready" || this.status === "unavailable") {
      return this.status;
    }

    return this.initialize();
  }

  private initialize(): AudioStatus {
    try {
      this.setStatus("loading");

      const sampler = this.createSampler();
      sampler.load();
      this.sampler = sampler;
      this.setStatus("ready");
    } catch {
      this.setStatus("unavailable");
    }

    return this.status;
  }

  private setStatus(status: AudioStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}
