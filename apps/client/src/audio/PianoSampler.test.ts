import { pianoNotes } from "../features/practice/practiceData";
import type { NoteId } from "../features/practice/practiceTypes";
import { PianoSampler, sampleFileByNote } from "./PianoSampler";

const createMockAudioBuffer = () => ({}) as AudioBuffer;

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

const createMockAudioContext = (state: "running" | "suspended" = "running") => {
  const destination = {} as AudioDestinationNode;
  const gain = {
    gain: {
      setValueAtTime: vi.fn()
    },
    connect: vi.fn(() => destination)
  };
  const sources: Array<{
    buffer: AudioBuffer | null;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
  }> = [];

  return {
    currentTime: 12.5,
    destination,
    state,
    decodeAudioData: vi.fn(async () => createMockAudioBuffer()),
    createBufferSource: vi.fn(() => {
      const source = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(() => gain),
        start: vi.fn()
      };
      sources.push(source);
      return source;
    }),
    createGain: vi.fn(() => gain),
    resume: vi.fn(async () => undefined),
    gain,
    sources
  };
};

type MockAudioContext = ReturnType<typeof createMockAudioContext>;

const stubAudioContext = (mockAudioContext: MockAudioContext) => {
  const MockAudioContextConstructor = vi.fn(() => mockAudioContext);

  vi.stubGlobal("AudioContext", MockAudioContextConstructor);
  Object.defineProperty(window, "AudioContext", {
    value: MockAudioContextConstructor,
    configurable: true
  });
};

describe("PianoSampler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "AudioContext");
  });

  it("preloads and decodes every bundled note sample", async () => {
    const mockAudioContext = createMockAudioContext();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8)
    }));

    vi.stubGlobal("fetch", fetchMock);
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();

    await sampler.load();

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual(pianoNotes.map((noteId) => expectedSampleUrls[noteId]));
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalledTimes(Object.keys(sampleFileByNote).length);
  });

  it("starts an already decoded buffer immediately on key press", async () => {
    const mockAudioContext = createMockAudioContext();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8)
      }))
    );
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();
    await sampler.load();

    expect(sampler.play("C4" satisfies NoteId, 0.7)).toBe(true);
    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.gain.gain.setValueAtTime).toHaveBeenCalledWith(0.7, mockAudioContext.currentTime);
    expect(mockAudioContext.sources[0].start).toHaveBeenCalledWith(mockAudioContext.currentTime);
  });

  it("resumes a suspended AudioContext from the key press gesture", async () => {
    const mockAudioContext = createMockAudioContext("suspended");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8)
      }))
    );
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();
    await sampler.load();

    expect(sampler.play("E4")).toBe(true);
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.sources[0].start).toHaveBeenCalledWith(mockAudioContext.currentTime);
  });

  it("returns false when a note is requested before its buffer is ready", () => {
    const mockAudioContext = createMockAudioContext();

    vi.stubGlobal("fetch", vi.fn());
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();

    expect(sampler.play("C4")).toBe(false);
  });
});
