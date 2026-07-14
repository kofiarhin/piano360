import { useCallback, useEffect, useRef, useState } from "react";

import { TimelineClock } from "./timelineTransport";

type UseTimelineTransportOptions = {
  bpm: number;
  totalBeats: number;
  countInBeats: number;
};

export const useTimelineTransport = ({
  bpm,
  totalBeats,
  countInBeats
}: UseTimelineTransportOptions) => {
  const clockRef = useRef<TimelineClock | undefined>(undefined);
  if (!clockRef.current) {
    clockRef.current = new TimelineClock({ bpm, totalBeats, countInBeats });
  }

  const clock = clockRef.current;
  const [currentBeat, setCurrentBeat] = useState(() => clock.currentBeat());
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedBpm, setSelectedBpmState] = useState(bpm);

  useEffect(() => {
    if (!isPlaying) return;

    let frameId = 0;
    const tick = () => {
      setCurrentBeat(clock.currentBeat());
      const playing = clock.isPlaying();
      setIsPlaying(playing);
      if (playing) frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [clock, isPlaying]);

  const play = useCallback(() => {
    clock.play();
    setIsPlaying(clock.isPlaying());
  }, [clock]);

  const pause = useCallback(() => {
    clock.pause();
    setCurrentBeat(clock.currentBeat());
    setIsPlaying(false);
  }, [clock]);

  const restart = useCallback(() => {
    clock.restart();
    setCurrentBeat(clock.currentBeat());
    setIsPlaying(false);
  }, [clock]);

  const seek = useCallback(
    (beat: number) => {
      clock.seek(beat);
      setCurrentBeat(clock.currentBeat());
    },
    [clock]
  );

  const setBpm = useCallback(
    (nextBpm: number) => {
      clock.setBpm(nextBpm);
      setSelectedBpmState(nextBpm);
      setCurrentBeat(clock.currentBeat());
    },
    [clock]
  );

  return {
    currentBeat,
    getCurrentBeat: () => clock.currentBeat(),
    getCurrentTimestampMs: () => clock.currentTimestampMs(),
    getBeatAtTimestamp: (timestampMs: number) => clock.beatAtTimestamp(timestampMs),
    getElapsedMillisecondsAt: (timestampMs: number) => clock.elapsedMillisecondsAt(timestampMs),
    beatToTimestampMs: (beat: number) => clock.beatToTimestampMs(beat),
    isPlaying,
    isComplete: currentBeat >= totalBeats,
    selectedBpm,
    play,
    pause,
    restart,
    seek,
    setBpm
  };
};
