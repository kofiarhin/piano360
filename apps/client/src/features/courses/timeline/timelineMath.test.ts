import {
  beatToMilliseconds,
  beatToPixels,
  millisecondsToBeat,
  tempoFromPercent
} from "./timelineMath";

describe("timelineMath", () => {
  it("converts beats to elapsed time at the selected tempo", () => {
    expect(beatToMilliseconds(3.5, 120)).toBe(1750);
    expect(beatToMilliseconds(3.5, 60)).toBe(3500);
    expect(millisecondsToBeat(3500, 60)).toBe(3.5);
  });

  it("keeps musical spacing independent from tempo", () => {
    expect(beatToPixels(3.5, 72)).toBe(252);
    expect(beatToPixels(0.5, 72)).toBe(36);
  });

  it("calculates practice BPM from the original tempo", () => {
    expect(tempoFromPercent(120, 70)).toBe(84);
    expect(tempoFromPercent(91, 60)).toBe(55);
  });
});
