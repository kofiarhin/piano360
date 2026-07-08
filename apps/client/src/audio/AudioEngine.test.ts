import { AudioEngine } from "./AudioEngine";
import { pianoNotes } from "../features/practice/practiceData";
import type { NoteId } from "../features/practice/practiceTypes";

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
  it("warms audio by preloading samples", async () => {
    const { engine, sampler } = createAudioHarness();

    await engine.warm();

    expect(engine.getStatus()).toBe("ready");
    expect(sampler.load).toHaveBeenCalledTimes(1);
  });

  it("initializes and triggers the sampler from the first playNote call", async () => {
    const { engine, sampler } = createAudioHarness();

    await engine.playNote("C4");

    expect(sampler.load).toHaveBeenCalledTimes(1);
    expect(sampler.play).toHaveBeenCalledWith("C4", undefined);
  });

  it("plays every note defined for the virtual piano", async () => {
    const { engine, sampler } = createAudioHarness();

    for (const noteId of pianoNotes) {
      await engine.playNote(noteId);
    }

    expect(sampler.play).toHaveBeenCalledTimes(pianoNotes.length);
    expect(sampler.play.mock.calls.map((call) => call[0] as NoteId)).toEqual(pianoNotes);
  });
});
