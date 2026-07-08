import type { NoteId } from "../features/practice/practiceTypes";
import { AudioEngine, type AudioStatus } from "./AudioEngine";

const audioEngine = new AudioEngine();

export const playNote = (noteId: NoteId) => {
  void audioEngine.playNote(noteId);
};

export const playGuideNote = (noteId: NoteId) => {
  void audioEngine.playNote(noteId, 0.45);
};

export const warmAudio = () => {
  void audioEngine.warm();
};

export const getAudioStatus = (): AudioStatus => audioEngine.getStatus();

export const subscribeToAudioStatus = (listener: (status: AudioStatus) => void) => audioEngine.subscribe(listener);
