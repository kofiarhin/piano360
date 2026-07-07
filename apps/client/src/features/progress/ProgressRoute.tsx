import { exercises, type Exercise } from "../../content";
import { useProgressContext } from "../../app/ProgressProvider";
import { formatCategory, percent } from "../../shared/format";
import { getCategoryCompletion, getSkillProgressRows } from "./progressSelectors";

export const ProgressRoute = () => {
  const { progress, storageAvailable, storageIssue, resetProgress } = useProgressContext();
  const recentExercises = progress.recentExerciseIds
    .map((exerciseId) => exercises.find((exercise) => exercise.id === exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise));

  return (
    <div className="space-y-6">
      <header className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Progress</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight">Local device progress</h1>
        <p className="mt-3 text-ink/70">
          Progress is stored only on this device for the MVP. No sign-in or cloud sync is required.
        </p>
        {storageIssue && (
          <p className="mt-3 rounded-md bg-paper p-3 text-sm font-bold" role="status">
            {storageIssue}
          </p>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Completed" value={progress.completedExerciseIds.length.toString()} />
        <Metric label="Streak" value={progress.currentStreak.toString()} />
        <Metric label="Sessions" value={progress.totalPracticeSessions.toString()} />
        <Metric label="Storage" value={storageAvailable ? "Local" : "Blocked"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
          <h2 className="text-2xl font-black">Recent exercises</h2>
          {recentExercises.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {recentExercises.map((exercise) => (
                <li key={exercise.id} className="rounded-md bg-paper p-3 font-bold">
                  {exercise.title}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-ink/70">No completed exercises yet.</p>
          )}
        </div>

        <div className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
          <h2 className="text-2xl font-black">Category completion</h2>
          <div className="mt-4 space-y-4">
            {getCategoryCompletion(progress).map((row) => (
              <div key={row.category}>
                <div className="flex justify-between gap-4 text-sm font-bold">
                  <span>{formatCategory(row.category)}</span>
                  <span>
                    {row.completed}/{row.total}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-paper">
                  <div className="h-2 rounded-full bg-clay" style={{ width: `${percent(row.completed, row.total)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
        <h2 className="text-2xl font-black">Skill progress</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {getSkillProgressRows(progress).map(({ skill, progress: skillProgress }) => (
            <article key={skill.id} className="rounded-md bg-paper p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-black">{skill.title}</h3>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                  {skillProgress?.mastery ?? "unseen"}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/70">{skill.description}</p>
              <p className="mt-3 font-mono text-sm">
                Confidence {Math.round((skillProgress?.confidence ?? 0) * 100)}%
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
        <h2 className="text-2xl font-black">Reset</h2>
        <p className="mt-2 text-ink/70">This clears only the local progress snapshot on this device.</p>
        <button className="mt-4 rounded-md bg-ink px-4 py-2 font-bold text-white" type="button" onClick={resetProgress}>
          Reset progress
        </button>
      </section>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10">
    <dt className="text-sm font-bold uppercase tracking-wide text-ink/60">{label}</dt>
    <dd className="mt-2 text-3xl font-black">{value}</dd>
  </div>
);
