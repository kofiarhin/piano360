import { Link } from "react-router-dom";

import type { Exercise } from "../../content";
import { formatCategory } from "../../shared/format";

type LessonCardProps = {
  exercise: Exercise;
  completed: boolean;
  unlocked: boolean;
};

export const LessonCard = ({ exercise, completed, unlocked }: LessonCardProps) => {
  return (
    <article className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-ink/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-clay">{formatCategory(exercise.category)}</p>
          <h3 className="mt-1 text-xl font-black">{exercise.title}</h3>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-ink">
          {completed ? "Completed" : unlocked ? "Ready" : "Locked"}
        </span>
      </div>
      <p className="mt-3 text-sm text-ink/70">{exercise.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink/55">Duration</dt>
          <dd className="font-bold">{exercise.estimatedMinutes} min</dd>
        </div>
        <div>
          <dt className="text-ink/55">Difficulty</dt>
          <dd className="font-bold">{exercise.difficulty}</dd>
        </div>
      </dl>
      {unlocked ? (
        <Link
          className="mt-4 inline-flex rounded-md bg-ink px-4 py-2 font-bold text-white transition active:translate-y-0.5"
          to={`/practice/${exercise.id}`}
        >
          Practice
        </Link>
      ) : (
        <p className="mt-4 text-sm font-bold text-ink/60">Complete the prerequisite drill first.</p>
      )}
    </article>
  );
};
