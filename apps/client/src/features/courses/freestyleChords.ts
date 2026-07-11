import type { NoteId } from "./courseTypes";

export type FreestyleChord = {
  name: string;
  quality: string;
  inversion: string;
};

const pitchClassNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
] as const;

const pitchClassByName = new Map<string, number>(
  pitchClassNames.map((name, index) => [name, index])
);

type ChordQualityDefinition = {
  quality: string;
  intervals: readonly number[];
};

const chordQualities: readonly ChordQualityDefinition[] = [
  { quality: "Major", intervals: [0, 4, 7] },
  { quality: "Minor", intervals: [0, 3, 7] },
  { quality: "Diminished", intervals: [0, 3, 6] },
  { quality: "Augmented", intervals: [0, 4, 8] },
  { quality: "Suspended 2", intervals: [0, 2, 7] },
  { quality: "Suspended 4", intervals: [0, 5, 7] },
  { quality: "Dominant 7", intervals: [0, 4, 7, 10] },
  { quality: "Major 7", intervals: [0, 4, 7, 11] },
  { quality: "Minor 7", intervals: [0, 3, 7, 10] },
  { quality: "Half-Diminished 7", intervals: [0, 3, 6, 10] },
  { quality: "Diminished 7", intervals: [0, 3, 6, 9] }
] as const;

const inversionLabels = [
  "Root Position",
  "1st Inversion",
  "2nd Inversion",
  "3rd Inversion"
] as const;

const parseNote = (noteId: NoteId) => {
  const match = /^([A-G]#?)(\d)$/.exec(noteId);
  if (!match) {
    return undefined;
  }

  const [, name, octaveText] = match;
  const pitchClass = pitchClassByName.get(name);
  if (pitchClass === undefined) {
    return undefined;
  }

  return {
    pitchClass,
    midi: (Number(octaveText) + 1) * 12 + pitchClass
  };
};

const samePitchClassSet = (first: number[], second: number[]) => {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
};

const normalizedPitchClassesFor = (root: number, intervals: readonly number[]) =>
  intervals.map((interval) => (root + interval) % 12).sort((first, second) => first - second);

export const identifyFreestyleChord = (noteIds: NoteId[]): FreestyleChord | null => {
  const parsedNotes = noteIds.map(parseNote).filter((note): note is NonNullable<typeof note> =>
    Boolean(note)
  );
  const pitchClasses = [...new Set(parsedNotes.map((note) => note.pitchClass))].sort(
    (first, second) => first - second
  );

  if (pitchClasses.length < 3) {
    return null;
  }

  const bassPitchClass = parsedNotes.reduce((lowest, note) =>
    note.midi < lowest.midi ? note : lowest
  ).pitchClass;

  for (const root of pitchClasses) {
    for (const chordQuality of chordQualities) {
      const expectedPitchClasses = normalizedPitchClassesFor(root, chordQuality.intervals);
      if (!samePitchClassSet(pitchClasses, expectedPitchClasses)) {
        continue;
      }

      const bassInterval = (bassPitchClass - root + 12) % 12;
      const inversionIndex = chordQuality.intervals.indexOf(bassInterval);

      if (inversionIndex === -1) {
        continue;
      }

      return {
        name: `${pitchClassNames[root]} ${chordQuality.quality}`,
        quality: chordQuality.quality,
        inversion: inversionLabels[inversionIndex] ?? "Root Position"
      };
    }
  }

  return null;
};
