import * as Tone from "tone";

import { type NoteId } from "../features/notes";

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

const publicBaseUrl = import.meta.env.BASE_URL || "/";
const publicAssetBaseUrl = publicBaseUrl.endsWith("/") ? publicBaseUrl : `${publicBaseUrl}/`;
const SAMPLE_BASE_URL = `${publicAssetBaseUrl}audio/piano/`;
const NOTE_DURATION = "8n";

export const sampleUrlFor = (note: NoteId) => `${SAMPLE_BASE_URL}${sampleFileByNote[note]}`;

const clampVelocity = (velocity: number) => Math.min(1, Math.max(0, velocity));

export class PianoSampler {
  private sampler: Tone.Sampler | undefined;
  private loadPromise: Promise<void> | undefined;
  private unlockPromise: Promise<void> | undefined;

  load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (this.sampler?.loaded) {
      return Promise.resolve();
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      try {
        const sampler =
          this.sampler ??
          new Tone.Sampler({
            urls: sampleFileByNote,
            baseUrl: SAMPLE_BASE_URL,
            onload: () => resolve(),
            onerror: (error) => {
              reject(new Error(`Could not load piano samples: ${String(error)}`));
            }
          }).toDestination();

        this.sampler = sampler;

        if (sampler.loaded) {
          resolve();
        }
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error(`Could not initialize piano sampler: ${String(error)}`)
        );
      }
    })
      .catch((error) => {
        this.sampler?.dispose();
        this.sampler = undefined;
        throw error;
      })
      .finally(() => {
        this.loadPromise = undefined;
      });

    return this.loadPromise;
  }

  async unlock(): Promise<void> {
    if (Tone.getContext().state === "running") {
      return;
    }

    if (!this.unlockPromise) {
      this.unlockPromise = Tone.start()
        .then(() => undefined)
        .catch((error) => {
          throw error instanceof Error
            ? error
            : new Error(`Could not unlock piano audio: ${String(error)}`);
        })
        .finally(() => {
          this.unlockPromise = undefined;
        });
    }

    return this.unlockPromise;
  }

  async play(noteId: NoteId, velocity = 0.92): Promise<boolean> {
    try {
      await this.unlock();
      await this.load();
      this.sampler?.triggerAttackRelease(noteId, NOTE_DURATION, undefined, clampVelocity(velocity));
      return Boolean(this.sampler);
    } catch (error) {
      console.warn("Piano playback failed:", error);
      return false;
    }
  }

  dispose(): void {
    this.sampler?.dispose();
    this.sampler = undefined;
    this.loadPromise = undefined;
    this.unlockPromise = undefined;
  }
}
