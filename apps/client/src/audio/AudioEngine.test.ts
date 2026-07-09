import { pianoNotes } from "../features/practice/practiceData";
import type { NoteId } from "../features/practice/practiceTypes";
import { AudioEngine } from "./AudioEngine";

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

type FakeSampler = {
  load: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  unlock: ReturnType<typeof vi.fn>;
};

const createAudioHarness = () => {
  const sampler: FakeSampler = {
    load: vi.fn().mockResolvedValue(undefined),
    play: vi.fn(() => true),
    unlock: vi.fn().mockResolvedValue(undefined)
  };
  const engine = new AudioEngine({
    createSampler: () => sampler
  });

  return { engine, sampler };
};

describe("AudioEngine", () => {
  it("reports loading until the sampler preload finishes", async () => {
    let finishLoad!: () => void;
    const statuses: string[] = [];
    const sampler: FakeSampler = {
      load: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishLoad = resolve;
          })
      ),
      play: vi.fn(() => true),
      unlock: vi.fn().mockResolvedValue(undefined)
    };
    const engine = new AudioEngine({ createSampler: () => sampler });

    engine.subscribe((status) => statuses.push(status));
    engine.warm();

    expect(engine.getStatus()).toBe("loading");
    expect(statuses).toEqual(["loading"]);

    finishLoad();
    await flushPromises();

    expect(engine.getStatus()).toBe("ready");
    expect(statuses).toEqual(["loading", "ready"]);
  });

  it("warms audio by preloading samples once", async () => {
    const { engine, sampler } = createAudioHarness();

    engine.warm();
    engine.warm();
    await flushPromises();

    expect(engine.getStatus()).toBe("ready");
    expect(sampler.load).toHaveBeenCalledTimes(1);
  });

  it("keeps the sampler instance warm and sends notes directly to it", async () => {
    const { engine, sampler } = createAudioHarness();

    engine.warm();
    await flushPromises();

    expect(engine.playNote("C4", 0.75)).toBe(true);
    expect(sampler.load).toHaveBeenCalledTimes(1);
    expect(sampler.play).toHaveBeenCalledWith("C4" satisfies NoteId, 0.75);
  });

  it("plays the first requested note immediately while samples are still loading", () => {
    const sampler: FakeSampler = {
      load: vi.fn(() => new Promise<void>(() => undefined)),
      play: vi.fn(() => true),
      unlock: vi.fn().mockResolvedValue(undefined)
    };
    const engine = new AudioEngine({ createSampler: () => sampler });

    expect(engine.playNote("C4")).toBe(true);

    expect(engine.getStatus()).toBe("loading");
    expect(sampler.load).toHaveBeenCalledTimes(1);
    expect(sampler.play).toHaveBeenCalledWith("C4" satisfies NoteId, undefined);
  });

  it("does not recreate the sampler for subsequent plays", async () => {
    const sampler: FakeSampler = {
      load: vi.fn().mockResolvedValue(undefined),
      play: vi.fn(() => true),
      unlock: vi.fn().mockResolvedValue(undefined)
    };
    const createSampler = vi.fn(() => sampler);
    const engine = new AudioEngine({ createSampler });

    engine.playNote("C4");
    await flushPromises();
    engine.playNote("D4");

    expect(createSampler).toHaveBeenCalledTimes(1);
    expect(sampler.load).toHaveBeenCalledTimes(1);
    expect(sampler.play.mock.calls.map((call) => call[0] as NoteId)).toEqual(["C4", "D4"]);
  });

  it("plays every note defined for the virtual piano", async () => {
    const { engine, sampler } = createAudioHarness();

    engine.warm();
    await flushPromises();

    for (const noteId of pianoNotes) {
      engine.playNote(noteId);
    }

    expect(sampler.play).toHaveBeenCalledTimes(pianoNotes.length);
    expect(sampler.play.mock.calls.map((call) => call[0] as NoteId)).toEqual(pianoNotes);
  });

  it("marks audio unavailable when sampler preload fails but retries on a later play gesture", async () => {
    const failedSampler: FakeSampler = {
      load: vi.fn(() => Promise.reject(new Error("decode failed"))),
      play: vi.fn().mockResolvedValue(false),
      unlock: vi.fn().mockResolvedValue(undefined)
    };
    const recoveredSampler: FakeSampler = {
      load: vi.fn().mockResolvedValue(undefined),
      play: vi.fn(() => true),
      unlock: vi.fn().mockResolvedValue(undefined)
    };
    const createSampler = vi.fn().mockReturnValueOnce(failedSampler).mockReturnValueOnce(recoveredSampler);
    const engine = new AudioEngine({ createSampler });

    engine.warm();
    await flushPromises();

    expect(engine.getStatus()).toBe("unavailable");
    expect(engine.playNote("C4")).toBe(true);

    await flushPromises();

    expect(createSampler).toHaveBeenCalledTimes(2);
    expect(recoveredSampler.load).toHaveBeenCalledTimes(1);
    expect(recoveredSampler.play).toHaveBeenCalledWith("C4" satisfies NoteId, undefined);
    expect(engine.getStatus()).toBe("ready");
  });

  it("contains asynchronous playback failures so later notes can still retry", async () => {
    const failingSampler: FakeSampler = {
      load: vi.fn().mockResolvedValue(undefined),
      play: vi.fn().mockRejectedValue(new Error("play blocked")),
      unlock: vi.fn().mockResolvedValue(undefined)
    };
    const engine = new AudioEngine({ createSampler: () => failingSampler });

    engine.warm();
    await flushPromises();

    expect(engine.playNote("C4")).toBe(true);
    await flushPromises();

    expect(engine.playNote("D4")).toBe(true);
    expect(failingSampler.play.mock.calls.map((call) => call[0] as NoteId)).toEqual(["C4", "D4"]);
  });
});
