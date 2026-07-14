import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { pianoNotes, type NoteId } from "../features/notes";

const toneMock = vi.hoisted(() => {
  const instances: MockSampler[] = [];
  const start = vi.fn(async () => undefined);
  const context = { state: "suspended" };
  type MockSamplerOptions = {
    urls?: Record<string, string>;
    baseUrl?: string;
    onload?: () => void;
    onerror?: (error: Error) => void;
  };

  class MockSampler {
    static nextShouldError = false;
    loaded = false;
    disposed = false;
    options: MockSamplerOptions;
    triggerAttackRelease = vi.fn();
    dispose = vi.fn(() => {
      this.disposed = true;
    });
    toDestination = vi.fn(() => this);

    constructor(options: MockSamplerOptions) {
      this.options = options;
      instances.push(this);
      queueMicrotask(() => {
        if (MockSampler.nextShouldError) {
          MockSampler.nextShouldError = false;
          options.onerror?.(new Error("load failed"));
        } else {
          this.loaded = true;
          options.onload?.();
        }
      });
    }
  }

  return { MockSampler, instances, start, context };
});

vi.mock("tone", () => ({
  Sampler: toneMock.MockSampler,
  start: toneMock.start,
  getContext: () => toneMock.context
}));

import { PianoSampler, sampleFileByNote, sampleUrlFor } from "./PianoSampler";

const expectedSampleUrls: Record<NoteId, string> = {
  A3: "/audio/piano/A3.mp3",
  "A#3": "/audio/piano/Bb3.mp3",
  B3: "/audio/piano/B3.mp3",
  C4: "/audio/piano/C4.mp3",
  "C#4": "/audio/piano/Db4.mp3",
  D4: "/audio/piano/D4.mp3",
  "D#4": "/audio/piano/Eb4.mp3",
  E4: "/audio/piano/E4.mp3",
  F4: "/audio/piano/F4.mp3",
  "F#4": "/audio/piano/Gb4.mp3",
  G4: "/audio/piano/G4.mp3",
  "G#4": "/audio/piano/Ab4.mp3",
  A4: "/audio/piano/A4.mp3",
  "A#4": "/audio/piano/Bb4.mp3",
  B4: "/audio/piano/B4.mp3",
  C5: "/audio/piano/C5.mp3"
};

describe("PianoSampler", () => {
  afterEach(() => {
    toneMock.instances.splice(0);
    toneMock.start.mockReset().mockResolvedValue(undefined);
    toneMock.context.state = "suspended";
    toneMock.MockSampler.nextShouldError = false;
  });

  it("builds public asset URLs for every piano sample", () => {
    expect(pianoNotes.map((noteId) => sampleUrlFor(noteId))).toEqual(
      pianoNotes.map((noteId) => expectedSampleUrls[noteId])
    );
  });

  it("ships every sample file referenced by the virtual piano", () => {
    for (const noteId of pianoNotes) {
      expect(
        existsSync(resolve(process.cwd(), "public", "audio", "piano", sampleFileByNote[noteId]))
      ).toBe(true);
    }
  });

  it("constructs Tone.Sampler with local sample options", async () => {
    const sampler = new PianoSampler();
    await sampler.load();

    expect(toneMock.instances).toHaveLength(1);
    expect(toneMock.instances[0].options.urls).toEqual(sampleFileByNote);
    expect(toneMock.instances[0].options.baseUrl).toBe("/audio/piano/");
    expect(toneMock.instances[0].toDestination).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent loads and creates one sampler per instance", async () => {
    const sampler = new PianoSampler();
    await Promise.all([sampler.load(), sampler.load()]);
    await sampler.load();

    expect(toneMock.instances).toHaveLength(1);
  });

  it("resets load state after failure so loading can retry", async () => {
    toneMock.MockSampler.nextShouldError = true;
    const sampler = new PianoSampler();

    await expect(sampler.load()).rejects.toThrow("Could not load piano samples");
    await expect(sampler.load()).resolves.toBeUndefined();

    expect(toneMock.instances).toHaveLength(2);
    expect(toneMock.instances[0].dispose).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent unlock calls", async () => {
    const sampler = new PianoSampler();
    await Promise.all([sampler.unlock(), sampler.unlock()]);

    expect(toneMock.start).toHaveBeenCalledTimes(1);
  });

  it("resets unlock state after failure so unlocking can retry", async () => {
    const sampler = new PianoSampler();
    toneMock.start.mockRejectedValueOnce(new Error("blocked"));

    await expect(sampler.unlock()).rejects.toThrow("blocked");
    await expect(sampler.unlock()).resolves.toBeUndefined();

    expect(toneMock.start).toHaveBeenCalledTimes(2);
  });

  it("plays the requested note after unlock and load with clamped velocity", async () => {
    const sampler = new PianoSampler();

    await expect(sampler.play("C4", 2)).resolves.toBe(true);

    expect(toneMock.start).toHaveBeenCalledTimes(1);
    expect(toneMock.instances[0].triggerAttackRelease).toHaveBeenCalledWith(
      "C4",
      "8n",
      undefined,
      1
    );
  });

  it("clamps low velocities", async () => {
    const sampler = new PianoSampler();

    await expect(sampler.play("A3", -1)).resolves.toBe(true);

    expect(toneMock.instances[0].triggerAttackRelease).toHaveBeenCalledWith(
      "A3",
      "8n",
      undefined,
      0
    );
  });

  it("returns false when unlock fails", async () => {
    const sampler = new PianoSampler();
    toneMock.start.mockRejectedValueOnce(new Error("blocked"));

    await expect(sampler.play("C4")).resolves.toBe(false);
    expect(toneMock.instances).toHaveLength(0);
  });

  it("disposes repeatedly and allows later reinitialization", async () => {
    const sampler = new PianoSampler();
    await sampler.load();
    sampler.dispose();
    sampler.dispose();
    await sampler.load();

    expect(toneMock.instances).toHaveLength(2);
    expect(toneMock.instances[0].dispose).toHaveBeenCalledTimes(1);
  });
});
