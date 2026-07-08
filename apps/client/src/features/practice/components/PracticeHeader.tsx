import type { PracticeMode, PracticeSong } from "../practiceTypes";
import { ModeSwitch } from "./ModeSwitch";
import { PlaybackControls } from "./PlaybackControls";

type PracticeHeaderProps = {
  songs: PracticeSong[];
  selectedSongId: string;
  mode: PracticeMode;
  isPlaying: boolean;
  isComplete: boolean;
  tempo: number;
  onSongChange: (songId: string) => void;
  onModeChange: (mode: PracticeMode) => void;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTempoChange: (tempo: number) => void;
};

export const PracticeHeader = ({
  songs,
  selectedSongId,
  mode,
  isPlaying,
  isComplete,
  tempo,
  onSongChange,
  onModeChange,
  onPlayPause,
  onPrevious,
  onNext,
  onTempoChange
}: PracticeHeaderProps) => (
  <header className="mx-auto grid w-full max-w-7xl gap-5 px-4 pt-5 md:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
    <div className="flex flex-wrap items-center gap-4">
      <h1 className="text-2xl font-black text-white md:text-3xl">Piano360</h1>
      <ModeSwitch mode={mode} onModeChange={onModeChange} />
    </div>
    <div className="flex flex-col gap-3 lg:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
          <span className="font-semibold">Song</span>
          <select
            value={selectedSongId}
            onChange={(event) => onSongChange(event.target.value)}
            className="bg-transparent text-sm font-semibold text-white outline-none"
          >
            {songs.map((song) => (
              <option key={song.id} value={song.id} className="bg-zinc-950 text-white">
                {song.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
          <span className="font-semibold">Key</span>
          <select value="A minor" disabled className="bg-transparent text-sm font-semibold text-zinc-300 outline-none">
            <option>A minor</option>
          </select>
        </label>
      </div>
      <PlaybackControls
        isPlaying={isPlaying}
        canPlay={mode === "practice" && !isComplete}
        canStep={mode === "practice"}
        tempo={tempo}
        onPlayPause={onPlayPause}
        onPrevious={onPrevious}
        onNext={onNext}
        onTempoChange={onTempoChange}
      />
    </div>
  </header>
);
