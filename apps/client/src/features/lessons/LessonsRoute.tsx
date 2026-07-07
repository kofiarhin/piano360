import { useProgressContext } from "../../app/ProgressProvider";
import { isExerciseCompleted, isExerciseUnlocked } from "../progress/progressSelectors";
import { getLessonExercises, getOrderedLessons } from "./lessonSelectors";
import { LessonCard } from "./LessonCard";

export const LessonsRoute = () => {
  const { progress } = useProgressContext();
  const orderedLessons = getOrderedLessons();

  return (
    <div className="space-y-7">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Beginner path</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Lessons</h1>
        <p className="mt-3 text-ink/70">Short drills build keyboard geography, finger control, and first chord shapes.</p>
      </header>

      {orderedLessons.map((lesson) => (
        <section key={lesson.id} className="space-y-4" aria-labelledby={lesson.id}>
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-ink/60">Lesson {lesson.order}</p>
            <h2 id={lesson.id} className="text-2xl font-black">
              {lesson.title}
            </h2>
            <p className="text-ink/70">{lesson.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {getLessonExercises(lesson.exerciseIds).map((exercise) => (
              <LessonCard
                key={exercise.id}
                exercise={exercise}
                completed={isExerciseCompleted(progress, exercise.id)}
                unlocked={isExerciseUnlocked(progress, exercise.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
