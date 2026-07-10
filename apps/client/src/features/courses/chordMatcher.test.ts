import { matchChordInput } from "./chordMatcher";

describe("chord matcher", () => {
  it("ignores order and duplicate collected notes", () => {
    expect(matchChordInput(["C4", "E4", "G4"], ["G4", "C4", "E4", "C4"])).toBe("correct");
  });

  it("stays pending while expected notes are missing", () => {
    expect(matchChordInput(["C4", "E4", "G4"], ["C4", "E4"])).toBe("pending");
  });

  it("rejects extra or incorrect notes", () => {
    expect(matchChordInput(["C4", "E4", "G4"], ["C4", "E4", "A4"])).toBe("incorrect");
  });
});
