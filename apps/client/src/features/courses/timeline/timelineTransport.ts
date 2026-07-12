import { millisecondsToBeat } from "./timelineMath";

type TimelineClockOptions = {
  bpm: number;
  totalBeats: number;
  countInBeats?: number;
  now?: () => number;
};

export class TimelineClock {
  private bpm: number;
  private readonly totalBeats: number;
  private readonly countInBeats: number;
  private readonly now: () => number;
  private anchorBeat: number;
  private anchorTimeMs = 0;
  private playing = false;

  constructor({
    bpm,
    totalBeats,
    countInBeats = 0,
    now = performance.now.bind(performance)
  }: TimelineClockOptions) {
    this.bpm = bpm;
    this.totalBeats = totalBeats;
    this.countInBeats = countInBeats;
    this.now = now;
    this.anchorBeat = -countInBeats;
  }

  currentBeat() {
    if (!this.playing) {
      return this.anchorBeat;
    }

    const beat = this.anchorBeat + millisecondsToBeat(this.now() - this.anchorTimeMs, this.bpm);
    if (beat >= this.totalBeats) {
      this.anchorBeat = this.totalBeats;
      this.playing = false;
      return this.totalBeats;
    }

    return beat;
  }

  play() {
    if (this.playing || this.anchorBeat >= this.totalBeats) return;
    this.anchorTimeMs = this.now();
    this.playing = true;
  }

  pause() {
    if (!this.playing) return;
    this.anchorBeat = this.currentBeat();
    this.playing = false;
  }

  seek(beat: number) {
    this.anchorBeat = Math.min(this.totalBeats, Math.max(0, beat));
    this.anchorTimeMs = this.now();
  }

  setBpm(bpm: number) {
    const currentBeat = this.currentBeat();
    this.bpm = bpm;
    this.anchorBeat = currentBeat;
    this.anchorTimeMs = this.now();
  }

  restart() {
    this.anchorBeat = -this.countInBeats;
    this.playing = false;
  }

  isPlaying() {
    this.currentBeat();
    return this.playing;
  }

  isComplete() {
    return this.currentBeat() >= this.totalBeats;
  }
}
