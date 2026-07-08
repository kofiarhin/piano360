import type { NoteId } from "../practiceTypes";

type FreePlayPanelProps = {
  lastPlayedNote?: NoteId;
};

const rows = [
  ["W", "E", "R", "Y", "U", "I"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"]
];

export const FreePlayPanel = ({ lastPlayedNote }: FreePlayPanelProps) => (
  <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_30px_100px_-60px_rgba(0,0,0,0.95)] md:p-10">
    <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
      <div>
        <p className="text-sm font-black uppercase text-violet-200">Freestyle Mode</p>
        <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Free Play</h2>
        <p className="mt-4 max-w-xl text-lg text-zinc-400">Play any key and hear the real piano note.</p>
        <p className="mt-6 text-sm font-semibold text-zinc-500">Tap a piano key, click it, or use your keyboard.</p>
      </div>
      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.035] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <p className="text-xs font-black uppercase text-zinc-500">Last played note</p>
        <p data-testid="last-played-note" className="mt-3 font-mono text-6xl font-black text-white md:text-7xl">
          {lastPlayedNote ?? "--"}
        </p>
        <div className="mt-8 space-y-2" aria-label="Computer keyboard map">
          {rows.map((row) => (
            <div key={row.join("")} className="flex flex-wrap justify-center gap-2">
              {row.map((key) => (
                <span
                  key={key}
                  className="grid h-8 min-w-8 place-items-center rounded-md border border-white/10 bg-zinc-900 px-2 font-mono text-xs font-bold text-zinc-300"
                >
                  {key}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
