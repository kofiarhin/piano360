import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { pianoNotes } from "../features/practice/practiceData";
import type { NoteId } from "../features/practice/practiceTypes";
import { PianoSampler, sampleFileByNote, sampleUrlFor } from "./PianoSampler";

const createMockAudioBuffer = () => ({}) as AudioBuffer;
type AudioDecodeSuccess = (buffer: AudioBuffer) => void;
type AudioDecodeFailure = (error: DOMException) => void;

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

const createMockFetchResponse = () => ({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(8)
});

const createMockAudioContext = (state: "running" | "suspended" = "running") => {
  const destination = {} as AudioDestinationNode;
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(() => destination)
  };
  const oscillator = {
    type: "sine",
    frequency: {
      setValueAtTime: vi.fn()
    },
    connect: vi.fn(() => gain),
    start: vi.fn(),
    stop: vi.fn()
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
    decodeAudioData: vi.fn((_bytes: ArrayBuffer, onSuccess?: AudioDecodeSuccess) => {
      const buffer = createMockAudioBuffer();
      onSuccess?.(buffer);
      return Promise.resolve(buffer);
    }),
    createBufferSource: vi.fn(() => {
      const source = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(() => gain),
        start: vi.fn()
      };
      sources.push(source);
      return source;
    }),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    resume: vi.fn(async () => undefined),
    gain,
    oscillator,
    sources
  };
};

type MockAudioContext = ReturnType<typeof createMockAudioContext>;
type MockSource = MockAudioContext["sources"][number];

const stubAudioContext = (mockAudioContext: MockAudioContext) => {
  const MockAudioContextConstructor = vi.fn(() => mockAudioContext);

  vi.stubGlobal("AudioContext", MockAudioContextConstructor);
  Object.defineProperty(window, "AudioContext", {
    value: MockAudioContextConstructor,
    configurable: true
  });
};

const expectSingleStartedSource = (mockAudioContext: MockAudioContext) => {
  expect(mockAudioContext.sources).toHaveLength(1);

  const [source] = mockAudioContext.sources as [MockSource];
  expect(source.start).toHaveBeenCalledWith(mockAudioContext.currentTime);
};

describe("PianoSampler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "AudioContext");
  });

  it("preloads and decodes every bundled note sample", async () => {
    const mockAudioContext = createMockAudioContext();
    const fetchMock = vi.fn(async (url: string) => {
      void url;
      return createMockFetchResponse();
    });

    vi.stubGlobal("fetch", fetchMock);
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();

    await sampler.load();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(pianoNotes.map((noteId) => expectedSampleUrls[noteId]));
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalledTimes(Object.keys(sampleFileByNote).length);
  });

  it("builds Vercel public asset URLs for every piano sample", () => {
    expect(pianoNotes.map((noteId) => sampleUrlFor(noteId))).toEqual(pianoNotes.map((noteId) => expectedSampleUrls[noteId]));
  });

  it("ships every sample file referenced by the virtual piano", () => {
    for (const noteId of pianoNotes) {
      expect(existsSync(resolve(process.cwd(), "public", "audio", "piano", sampleFileByNote[noteId]))).toBe(true);
    }
  });

  it("supports Safari callback-style decodeAudioData implementations", async () => {
    const mockAudioContext = createMockAudioContext();
    const decodedBuffer = createMockAudioBuffer();

    mockAudioContext.decodeAudioData.mockImplementation((_bytes: ArrayBuffer, onSuccess?: AudioDecodeSuccess) => {
      onSuccess?.(decodedBuffer);
      return undefined as unknown as Promise<AudioBuffer>;
    });

    vi.stubGlobal("fetch", vi.fn(async () => createMockFetchResponse()));
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();
    await sampler.load();

    await expect(sampler.play("C4" satisfies NoteId)).resolves.toBe(true);
    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1);
    expectSingleStartedSource(mockAudioContext);
  });

  it("starts an already decoded buffer immediately on key press", async () => {
    const mockAudioContext = createMockAudioContext();

    vi.stubGlobal("fetch", vi.fn(async () => createMockFetchResponse()));
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();
    await sampler.load();

    await expect(sampler.play("C4" satisfies NoteId, 0.7)).resolves.toBe(true);
    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.gain.gain.setValueAtTime).toHaveBeenCalledWith(0.7, mockAudioContext.currentTime);
    expectSingleStartedSource(mockAudioContext);
  });

  it("resumes a suspended AudioContext from the key press gesture", async () => {
    const mockAudioContext = createMockAudioContext("suspended");
    mockAudioContext.resume.mockImplementation(async () => {
      mockAudioContext.state = "running";
    });

    vi.stubGlobal("fetch", vi.fn(async () => createMockFetchResponse()));
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();
    await sampler.load();

    await expect(sampler.play("E4")).resolves.toBe(true);
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
    expectSingleStartedSource(mockAudioContext);
  });

  it("plays a fallback tone when a note is requested before its buffer is ready", async () => {
    const mockAudioContext = createMockAudioContext();

    vi.stubGlobal("fetch", vi.fn(async () => createMockFetchResponse()));
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();

    await expect(sampler.play("C4")).resolves.toBe(true);
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.oscillator.start).toHaveBeenCalledWith(mockAudioContext.currentTime);
    await sampler.load();
  });

  it("uses fallback tones for decode failures and retries missing samples later", async () => {
    const mockAudioContext = createMockAudioContext();
    let shouldDecodeFail = true;

    mockAudioContext.decodeAudioData.mockImplementation((_bytes: ArrayBuffer, onSuccess?: AudioDecodeSuccess, onFailure?: AudioDecodeFailure) => {
      if (shouldDecodeFail) {
        onFailure?.(new DOMException("Unable to decode audio data"));
        return Promise.reject(new DOMException("Unable to decode audio data"));
      }

      const buffer = createMockAudioBuffer();
      onSuccess?.(buffer);
      return Promise.resolve(buffer);
    });

    vi.stubGlobal("fetch", vi.fn(async () => createMockFetchResponse()));
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();
    await sampler.load();

    await expect(sampler.play("C4")).resolves.toBe(true);
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);

    shouldDecodeFail = false;
    await sampler.load();
    await expect(sampler.play("C4")).resolves.toBe(true);

    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1);
    expectSingleStartedSource(mockAudioContext);
  });

  it("resumes and plays a fallback tone for the first cold mobile tap while samples load", async () => {
    const mockAudioContext = createMockAudioContext("suspended");
    mockAudioContext.resume.mockImplementation(async () => {
      mockAudioContext.state = "running";
    });

    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();

    await expect(sampler.play("C4")).resolves.toBe(true);
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.oscillator.start).toHaveBeenCalledWith(mockAudioContext.currentTime);
  });

  it("does not resume the AudioContext again after the first successful unlock", async () => {
    const mockAudioContext = createMockAudioContext("suspended");
    mockAudioContext.resume.mockImplementation(async () => {
      mockAudioContext.state = "running";
    });

    vi.stubGlobal("fetch", vi.fn(async () => createMockFetchResponse()));
    stubAudioContext(mockAudioContext);

    const sampler = new PianoSampler();

    await expect(sampler.play("C4")).resolves.toBe(true);
    await expect(sampler.play("D4")).resolves.toBe(true);
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
  });
});
