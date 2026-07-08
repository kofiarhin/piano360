import type { NoteId } from "../practiceTypes";

type FreePlayPanelProps = {
  lastPlayedNote?: NoteId;
};

const rows = [
  ["W", "E", "R", "Y", "U", "I"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"]
];

export const FreePlayPanel = ({ lastPlayedNote }: FreePlayPanelProps) => (
  <section className="rounded-[2rem] border border-white/10 bg-zinc-950/55 p-4 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.95)] md:p-6">
    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Freestyle Mode</p>
        <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">Free Play</h2>
        <p className="mt-3 max-w-2xl text-sm font-semibold text-zinc-400 md:text-base">Use the piano below like a real instrument. Tap, click, or use the mapped computer keys.</p>
      </div>
      <div className="grid gap-4 rounded-[1.4rem] border border-white/[0.08] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:grid-cols-[auto_1fr] sm:items-center md:min-w-[29rem]">
        <div className="text-center sm:text-left">
          <p className="text-xs font-black uppercase text-zinc-500">Last played</p>
          <p data-testid="last-played-note" className="mt-1 font-mono text-4xl font-black text-white md:text-5xl">
            {lastPlayedNote ?? "--"}
          </p>
        </div>
        <div className="space-y-2" aria-label="Computer keyboard map">
          {rows.map((row) => (
            <div key={row.join("")} className="flex flex-wrap justify-center gap-1.5 sm:justify-end">
              {row.map((key) => (
                <span
                  key={key}
                  className="grid h-8 min-w-8 place-items-center rounded-md border border-white/10 bg-zinc-900 px-2 font-mono text-xs font-black text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
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
