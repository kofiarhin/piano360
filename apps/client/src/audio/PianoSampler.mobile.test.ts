import { afterEach, describe, expect, it, vi } from "vitest";

import { PianoSampler } from "./PianoSampler";

const createMockAudioContext = () => {
  const destination = {} as AudioDestinationNode;
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(() => destination),
    disconnect: vi.fn()
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
  const source = {
    buffer: null as AudioBuffer | null,
    connect: vi.fn(() => gain),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null
  };

  return {
    currentTime: 12.5,
    destination,
    sampleRate: 48_000,
    state: "suspended" as AudioContextState,
    createBuffer: vi.fn(() => ({}) as AudioBuffer),
    decodeAudioData: vi.fn(),
    createBufferSource: vi.fn(() => source),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    resume: vi.fn(),
    oscillator
  };
};

describe("PianoSampler Chrome mobile playback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "AudioContext");
  });

  it("waits for a suspended context to resume before starting the fallback tone", async () => {
    const audioContext = createMockAudioContext();
    let finishResume!: () => void;

    audioContext.resume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishResume = () => {
            audioContext.state = "running";
            resolve();
          };
        })
    );

    const AudioContextConstructor = vi.fn(() => audioContext);
    vi.stubGlobal("AudioContext", AudioContextConstructor);
    Object.defineProperty(window, "AudioContext", {
      value: AudioContextConstructor,
      configurable: true
    });
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    const sampler = new PianoSampler();
    const playPromise = sampler.play("C4");

    expect(audioContext.resume).toHaveBeenCalledTimes(1);
    expect(audioContext.createOscillator).not.toHaveBeenCalled();

    finishResume();

    await expect(playPromise).resolves.toBe(true);
    expect(audioContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(audioContext.oscillator.start).toHaveBeenCalledWith(audioContext.currentTime);

    sampler.dispose();
  });

  it("returns false and does not start audio when resume leaves the context suspended", async () => {
    const audioContext = createMockAudioContext();
    audioContext.resume.mockResolvedValue(undefined);

    const AudioContextConstructor = vi.fn(() => audioContext);
    vi.stubGlobal("AudioContext", AudioContextConstructor);
    Object.defineProperty(window, "AudioContext", {
      value: AudioContextConstructor,
      configurable: true
    });
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    const sampler = new PianoSampler();

    await expect(sampler.play("C4")).resolves.toBe(false);
    expect(audioContext.createOscillator).not.toHaveBeenCalled();

    sampler.dispose();
  });
});
