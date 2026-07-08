import type { NoteId, PianoKeyDefinition, PracticeSong } from "./practiceTypes";

export const pianoNotes: NoteId[] = [
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5"
];

export const whiteKeyMap: Record<string, NoteId> = {
  a: "A3",
  s: "B3",
  d: "C4",
  f: "D4",
  g: "E4",
  h: "F4",
  j: "G4",
  k: "A4",
  l: "B4",
  ";": "C5"
};

export const blackKeyMap: Record<string, NoteId> = {
  w: "A#3",
  e: "C#4",
  r: "D#4",
  y: "F#4",
  u: "G#4",
  i: "A#4"
};

export const keyboardMap: Record<string, NoteId> = {
  ...whiteKeyMap,
  ...blackKeyMap
};

export const pianoKeys: PianoKeyDefinition[] = pianoNotes.map((noteId) => {
  const keyboardKey = Object.entries(keyboardMap).find(([, note]) => note === noteId)?.[0];

  return {
    noteId,
    tone: noteId.includes("#") ? "black" : "white",
    keyboardKey: keyboardKey?.toUpperCase()
  };
});

export const practiceSongs: PracticeSong[] = [
  {
    id: "fur-elise-opening",
    title: "Fur Elise Opening",
    artist: "Ludwig van Beethoven",
    key: "A minor",
    measureCount: 4,
    notes: [
      "E4",
      "D#4",
      "E4",
      "D#4",
      "E4",
      "B3",
      "D4",
      "C4",
      "A3",
      "C4",
      "E4",
      "A4",
      "B4",
      "E4",
      "G#4",
      "B4",
      "C5"
    ]
  },
  {
    id: "twinkle-twinkle",
    title: "Twinkle Twinkle Little Star",
    artist: "Traditional",
    key: "C major",
    measureCount: 4,
    notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"]
  },
  {
    id: "mary-had-a-little-lamb",
    title: "Mary Had a Little Lamb",
    artist: "Traditional",
    key: "C major",
    measureCount: 4,
    notes: ["E4", "D4", "C4", "D4", "E4", "E4", "E4", "D4", "D4", "D4", "E4", "G4", "G4"]
  },
  {
    id: "ode-to-joy",
    title: "Ode to Joy",
    artist: "Ludwig van Beethoven",
    key: "C major",
    measureCount: 4,
    notes: ["E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4", "C4", "D4", "E4", "E4", "D4", "D4"]
  },
  {
    id: "jingle-bells",
    title: "Jingle Bells",
    artist: "Traditional",
    key: "C major",
    measureCount: 4,
    notes: ["E4", "E4", "E4", "E4", "E4", "E4", "E4", "G4", "C4", "D4", "E4"]
  },
  {
    id: "happy-birthday",
    title: "Happy Birthday",
    artist: "Traditional",
    key: "C major",
    measureCount: 4,
    notes: ["C4", "C4", "D4", "C4", "F4", "E4", "C4", "C4", "D4", "C4", "G4", "F4"]
  },
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    artist: "Traditional",
    key: "C major",
    measureCount: 4,
    notes: ["C4", "F4", "A4", "F4", "A4", "G4", "F4", "D4", "C4"]
  }
];
