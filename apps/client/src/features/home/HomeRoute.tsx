import { Link } from "react-router-dom";

import { exercises, lessons } from "../../content";
import { useProgressContext } from "../../app/ProgressProvider";
import { getRecommendation } from "../recommendations/recommendationEngine";
import { getRecommendationLabel } from "../recommendations/recommendationSelectors";

export const HomeRoute = () => {
  const { progress, storageIssue } = useProgressContext();
  const recommendation = getRecommendation(progress);
  const recommendedExercise =
    recommendation.type === "exercise" ? exercises.find((exercise) => exercise.id === recommendation.exerciseId) : undefined;
  const completedCount = progress.completedExerciseIds.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10 md:p-7">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Today</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Start at the keyboard, not in a menu.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink/70">
          The next drill keeps the visual target, hand, and finger number in view while you practice on a real piano.
        </p>

        <div className="mt-8 rounded-lg border border-ink/10 bg-paper p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-ink/60">
            {recommendation.type === "exercise" && recommendation.reason === "continue"
              ? "Continue"
              : "Recommended"}
          </p>
          <h2 className="mt-2 text-2xl font-black">{getRecommendationLabel(recommendation)}</h2>
          {recommendedExercise && <p className="mt-2 text-ink/70">{recommendedExercise.description}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            {recommendation.type === "exercise" ? (
              <Link
                className="rounded-md bg-ink px-5 py-3 font-bold text-white transition active:translate-y-0.5"
                to={`/practice/${recommendation.exerciseId}`}
              >
                Start practice
              </Link>
            ) : (
              <Link className="rounded-md bg-ink px-5 py-3 font-bold text-white" to="/practice/free">
                Open free practice
              </Link>
            )}
            <Link className="rounded-md bg-white px-5 py-3 font-bold text-ink ring-1 ring-ink/15" to="/lessons">
              View lessons
            </Link>
          </div>
        </div>
      </section>

      <aside className="grid gap-4">
        {storageIssue && (
          <div className="rounded-lg border border-clay/30 bg-white p-4 text-sm text-ink" role="status">
            {storageIssue}
          </div>
        )}
        <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10">
          <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Local progress</p>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-ink/60">Completed</dt>
              <dd className="text-3xl font-black">{completedCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/60">Streak</dt>
              <dd className="text-3xl font-black">{progress.currentStreak}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10">
          <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Path</p>
          <ol className="mt-3 space-y-3">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="border-l-4 border-ink/15 pl-3">
                <p className="font-bold">{lesson.title}</p>
                <p className="text-sm text-ink/65">{lesson.objective}</p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
};
