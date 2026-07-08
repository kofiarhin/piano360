import { AudioEngine } from "./AudioEngine";
import { pianoNotes } from "../features/practice/practiceData";
import type { NoteId } from "../features/practice/practiceTypes";

const flushPromises = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

type FakeSampler = {
  load: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
};

const createAudioHarness = () => {
  const sampler: FakeSampler = {
    load: vi.fn().mockResolvedValue(undefined),
    play: vi.fn(() => true)
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
      play: vi.fn(() => true)
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

  it("marks audio unavailable when sampler preload fails", async () => {
    const engine = new AudioEngine({
      createSampler: () => ({
        load: vi.fn(() => Promise.reject(new Error("decode failed"))),
        play: vi.fn(() => false)
      })
    });

    engine.warm();
    await flushPromises();

    expect(engine.getStatus()).toBe("unavailable");
    expect(engine.playNote("C4")).toBe(false);
  });
});
