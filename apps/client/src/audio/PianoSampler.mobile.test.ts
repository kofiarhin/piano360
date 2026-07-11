import { describe, expect, it } from "vitest";

import { PianoSampler } from "./PianoSampler";

describe("PianoSampler mobile playback", () => {
  it("uses the shared Tone.js PianoSampler abstraction for mobile gesture playback", () => {
    const sampler = new PianoSampler();
    expect(sampler).toHaveProperty("unlock");
    expect(sampler).toHaveProperty("play");
    sampler.dispose();
  });
});
