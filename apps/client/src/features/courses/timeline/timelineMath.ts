export const millisecondsPerBeat = (bpm: number) => 60_000 / bpm;

export const beatToMilliseconds = (beat: number, bpm: number) => beat * millisecondsPerBeat(bpm);

export const millisecondsToBeat = (milliseconds: number, bpm: number) =>
  milliseconds / millisecondsPerBeat(bpm);

export const beatToPixels = (beat: number, pixelsPerBeat: number) => beat * pixelsPerBeat;

export const tempoFromPercent = (originalBpm: number, percent: number) =>
  Math.max(1, Math.round(originalBpm * (percent / 100)));

export const songDurationMilliseconds = (totalBeats: number, bpm: number) =>
  beatToMilliseconds(totalBeats, bpm);

export const beatsPerMeasure = (numerator: number, denominator: number) =>
  numerator * (4 / denominator);
