import { chords, exercises, notes, progressions, scales } from "../../content";
import { formatCategory } from "../../shared/format";

const intervals = [
  { title: "Second", description: "Move to the neighboring white key." },
  { title: "Third", description: "Skip over one white key." },
  { title: "Fourth", description: "Open the hand from C to F." },
  { title: "Fifth", description: "Span the full five-finger position from C to G." }
];

export const LibraryRoute = () => (
  <div className="space-y-7">
    <header className="max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-wide text-clay">Reference</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Library</h1>
      <p className="mt-3 text-ink/70">The same typed content powers lessons, practice, and this compact reference.</p>
    </header>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
        <h2 className="text-2xl font-black">Notes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <article key={`${note.note}${note.octave}`} className="border-l-4 border-clay pl-3">
              <h3 className="font-black">{note.label}</h3>
              <p className="text-sm text-ink/70">{note.description}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
        <h2 className="text-2xl font-black">Intervals</h2>
        <div className="mt-4 space-y-3">
          {intervals.map((interval) => (
            <article key={interval.title}>
              <h3 className="font-black">{interval.title}</h3>
              <p className="text-sm text-ink/70">{interval.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
        <h2 className="text-2xl font-black">Triads</h2>
        <div className="mt-4 grid gap-3">
          {chords.map((chord) => (
            <article key={chord.id} className="rounded-md bg-paper p-4">
              <h3 className="font-black">{chord.title}</h3>
              <p className="text-sm text-ink/70">{chord.description}</p>
              <p className="mt-2 font-mono text-sm">{chord.notes.map((note) => note.displayLabel).join(" - ")}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
        <h2 className="text-2xl font-black">Five-finger positions</h2>
        <div className="mt-4 grid gap-3">
          {scales.map((scale) => (
            <article key={scale.id} className="rounded-md bg-paper p-4">
              <h3 className="font-black">{scale.title}</h3>
              <p className="text-sm text-ink/70">{scale.description}</p>
              <p className="mt-2 font-mono text-sm">{scale.notes.map((note) => note.displayLabel).join(" - ")}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
      <h2 className="text-2xl font-black">Chord progressions</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {progressions.map((progression) => (
          <article key={progression.id} className="rounded-md bg-paper p-4">
            <h3 className="font-black">{progression.title}</h3>
            <p className="text-sm text-ink/70">{progression.description}</p>
            <p className="mt-2 font-mono text-sm">{progression.numerals.join(" - ")}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
      <h2 className="text-2xl font-black">Exercises</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {exercises.map((exercise) => (
          <article key={exercise.id} className="border-l-4 border-ink/15 pl-3">
            <h3 className="font-black">{exercise.title}</h3>
            <p className="text-sm text-ink/70">
              {formatCategory(exercise.category)} - {exercise.estimatedMinutes} min
            </p>
          </article>
        ))}
      </div>
    </section>
  </div>
);
