import { PianoSampler } from "./PianoSampler";
import { pianoNotes } from "../features/practice/practiceData";
import type { NoteId } from "../features/practice/practiceTypes";

class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  preload = "";
  volume = 1;
  playbackRate = 1;
  load = vi.fn();
  play = vi.fn().mockResolvedValue(undefined);
  addEventListener = vi.fn();

  constructor(src = "") {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

describe("PianoSampler", () => {
  const originalAudio = globalThis.Audio;
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

  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal("Audio", FakeAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.Audio = originalAudio;
  });

  it("preloads the available MP3 samples", async () => {
    const sampler = new PianoSampler();

    await sampler.load();

    expect(FakeAudio.instances.map((audio) => audio.src)).toEqual(pianoNotes.map((noteId) => expectedSampleUrls[noteId]));
    expect(FakeAudio.instances.every((audio) => audio.load.mock.calls.length === 1)).toBe(true);
  });

  it("plays an exact sample note from the local MP3 file", async () => {
    const sampler = new PianoSampler();

    await sampler.load();
    expect(sampler.play("C4")).toBe(true);

    const player = FakeAudio.instances.at(-1);
    expect(player?.src).toBe("/audio/piano/C4.mp3");
    expect(player?.playbackRate).toBe(1);
    expect(player?.play).toHaveBeenCalledTimes(1);
  });

  it("plays a sharp note through its URL-safe flat sample file", async () => {
    const sampler = new PianoSampler();

    await sampler.load();
    expect(sampler.play("C#4")).toBe(true);

    const player = FakeAudio.instances.at(-1);
    expect(player?.src).toBe("/audio/piano/Db4.mp3");
    expect(player?.playbackRate).toBe(1);
    expect(player?.play).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["A#3", "/audio/piano/Bb3.mp3"],
    ["C#4", "/audio/piano/Db4.mp3"],
    ["D#4", "/audio/piano/Eb4.mp3"],
    ["F#4", "/audio/piano/Gb4.mp3"],
    ["G#4", "/audio/piano/Ab4.mp3"],
    ["A#4", "/audio/piano/Bb4.mp3"]
  ])("plays black key %s through %s", async (noteId, expectedSampleUrl) => {
    const sampler = new PianoSampler();

    await sampler.load();
    expect(sampler.play(noteId as NoteId)).toBe(true);

    expect(FakeAudio.instances.at(-1)?.src).toBe(expectedSampleUrl);
    expect(FakeAudio.instances.at(-1)?.play).toHaveBeenCalledTimes(1);
  });

  it("creates a playable audio element for every virtual piano note", async () => {
    const sampler = new PianoSampler();

    await sampler.load();

    for (const noteId of pianoNotes) {
      expect(sampler.play(noteId)).toBe(true);
    }

    const players = FakeAudio.instances.slice(-pianoNotes.length);
    expect(players).toHaveLength(pianoNotes.length);
    expect(players.every((player) => player.src.endsWith(".mp3"))).toBe(true);
    expect(players.every((player) => player.play.mock.calls.length === 1)).toBe(true);
    expect(players.every((player) => player.playbackRate > 0)).toBe(true);
  });

  it.each([
    ["D4", "/audio/piano/D4.mp3"],
    ["E4", "/audio/piano/E4.mp3"],
    ["F4", "/audio/piano/F4.mp3"],
    ["G4", "/audio/piano/G4.mp3"],
    ["B4", "/audio/piano/B4.mp3"]
  ])("plays %s through its exact sample", async (noteId, expectedSampleUrl) => {
    const sampler = new PianoSampler();

    await sampler.load();
    expect(sampler.play(noteId as (typeof pianoNotes)[number])).toBe(true);

    expect(FakeAudio.instances.at(-1)?.src).toBe(expectedSampleUrl);
    expect(FakeAudio.instances.at(-1)?.play).toHaveBeenCalledTimes(1);
  });
});
