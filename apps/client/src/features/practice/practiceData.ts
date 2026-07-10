import { blackKeyMap, keyboardMap, pianoKeys, pianoNotes, whiteKeyMap } from "../notes";
import type { PracticeSong } from "./practiceTypes";

export { blackKeyMap, keyboardMap, pianoKeys, pianoNotes, whiteKeyMap };

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
