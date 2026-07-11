import { describe, expect, it } from "vitest";

import { identifyFreestyleChord } from "./freestyleChords";

describe("freestyle chord recognition", () => {
  it("identifies a root-position major triad", () => {
    expect(identifyFreestyleChord(["C4", "E4", "G4"])).toEqual({
      name: "C Major",
      quality: "Major",
      inversion: "Root Position"
    });
  });

  it("identifies inversions from the bass note", () => {
    expect(identifyFreestyleChord(["E4", "G4", "C5"])).toEqual({
      name: "C Major",
      quality: "Major",
      inversion: "1st Inversion"
    });
  });

  it("ignores duplicate pitch classes when matching chords", () => {
    expect(identifyFreestyleChord(["C4", "E4", "G4", "C5"])).toEqual({
      name: "C Major",
      quality: "Major",
      inversion: "Root Position"
    });
  });

  it("returns null for unsupported note combinations", () => {
    expect(identifyFreestyleChord(["C4", "D4", "F4"])).toBeNull();
  });
});
