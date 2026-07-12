import { TimelineClock } from "./timelineTransport";

describe("TimelineClock", () => {
  it("stays synchronized through play, pause, seek, tempo, and restart", () => {
    let now = 1000;
    const clock = new TimelineClock({
      bpm: 120,
      totalBeats: 16,
      countInBeats: 4,
      now: () => now
    });

    expect(clock.currentBeat()).toBe(-4);
    clock.play();
    now += 2000;
    expect(clock.currentBeat()).toBe(0);

    clock.pause();
    now += 5000;
    expect(clock.currentBeat()).toBe(0);

    clock.seek(8);
    clock.setBpm(60);
    clock.play();
    now += 2000;
    expect(clock.currentBeat()).toBe(10);

    clock.restart();
    expect(clock.currentBeat()).toBe(-4);
    expect(clock.isPlaying()).toBe(false);
  });

  it("clamps at the song end", () => {
    let now = 0;
    const clock = new TimelineClock({ bpm: 60, totalBeats: 2, now: () => now });
    clock.play();
    now = 3000;

    expect(clock.currentBeat()).toBe(2);
    expect(clock.isComplete()).toBe(true);
    expect(clock.isPlaying()).toBe(false);
  });
});
