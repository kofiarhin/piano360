import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { courseQueryKeys, getCourse } from "./courseQueries";
import { formatDuration, formatPercent } from "./formatMetrics";
import {
  isLessonCompleted,
  isLessonUnlocked,
  lessonProgressKey,
  loadProgress,
  resetStoredProgress
} from "./progressStorage";
import { isLessonPlayableInPhaseA } from "./timeline/resolveLessonToTimeline";

type CourseOverviewProps = {
  onProgressReset: () => void;
};

export const CourseOverview = ({ onProgressReset }: CourseOverviewProps) => {
  const { courseSlug } = useParams();
  const progressState = loadProgress();
  const courseQuery = useQuery({
    queryKey: courseQueryKeys.course(courseSlug ?? ""),
    queryFn: () => getCourse(courseSlug ?? ""),
    enabled: Boolean(courseSlug)
  });

  if (!courseSlug) {
    return <Navigate to="/courses" replace />;
  }

  if (courseQuery.isLoading) {
    return (
      <main className="min-h-[100dvh] bg-[#12110f] px-4 py-8 text-stone-100">
        <div className="mx-auto h-80 max-w-7xl animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
      </main>
    );
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#12110f] px-4 text-stone-100">
        <section className="max-w-lg rounded-xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-3xl font-black">Course not found</h1>
          <Link
            className="mt-4 inline-block rounded-lg bg-amber-200 px-4 py-2 font-black text-stone-950"
            to="/courses"
          >
            Return to courses
          </Link>
        </section>
      </main>
    );
  }

  const course = courseQuery.data;
  const orderedLessons = [...course.lessons].sort((first, second) => first.order - second.order);

  return (
    <main className="min-h-[100dvh] bg-[#12110f] text-stone-100">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-6 md:px-6 lg:py-10">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="font-bold text-amber-100 underline-offset-4 hover:underline"
            to="/courses"
          >
            Course Library
          </Link>
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                resetStoredProgress();
                onProgressReset();
              }}
              className="rounded-lg border border-rose-200/30 px-3 py-2 text-sm font-black text-rose-100 transition active:translate-y-0.5"
            >
              Reset local progress
            </button>
          )}
        </nav>

        <header className="grid gap-5 border-b border-white/10 pb-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-amber-200/80">
              {course.contentType} / {course.hand} hand / {course.difficulty}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-none tracking-tight md:text-6xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-2xl text-stone-300">{course.description}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono font-black">
            {progressState.progress.completedLessons[course.slug]?.length ?? 0}/
            {orderedLessons.length} lessons
          </div>
        </header>

        <section className="grid gap-3">
          {orderedLessons.map((lesson) => {
            const completed = isLessonCompleted(progressState.progress, course.slug, lesson.slug);
            const unlocked = isLessonUnlocked(progressState.progress, course, lesson);
            const playable = isLessonPlayableInPhaseA(course.slug, lesson);
            const stats =
              progressState.progress.lessonStats[lessonProgressKey(course.slug, lesson.slug)];

            return (
              <article
                key={lesson.slug}
                className={[
                  "grid gap-4 rounded-xl border p-4 md:grid-cols-[auto_1fr_auto] md:items-center",
                  unlocked
                    ? "border-white/10 bg-[#f6f2ea] text-stone-950"
                    : "border-white/10 bg-white/[0.035] text-stone-400"
                ].join(" ")}
              >
                <div className="grid h-12 w-12 place-items-center rounded-lg border border-current/20 font-mono text-lg font-black">
                  {lesson.order}
                </div>
                <div>
                  <h2 className="text-xl font-black">{lesson.title}</h2>
                  <p className="mt-1 font-mono text-xs font-black uppercase text-stone-500">
                    {playable
                      ? lesson.mode === "timeline"
                        ? "Rhythm timeline"
                        : "Instructional timeline"
                      : "Timing source required"}
                  </p>
                  <p
                    className={
                      unlocked ? "mt-1 text-sm text-stone-700" : "mt-1 text-sm text-stone-400"
                    }
                  >
                    {lesson.description}
                  </p>
                  {stats && (
                    <p className="mt-2 font-mono text-xs font-black uppercase tracking-[0.16em]">
                      {formatPercent(stats.accuracy)} accuracy / {formatDuration(stats.durationMs)}{" "}
                      / {stats.restartCount} restarts
                      {stats.rhythmicAccuracy !== undefined
                        ? ` / ${formatPercent(stats.rhythmicAccuracy)} rhythm`
                        : ""}
                    </p>
                  )}
                </div>
                {!playable ? (
                  <span className="rounded-lg border border-amber-700/20 bg-amber-100/60 px-4 py-2 text-center font-black text-amber-950">
                    Coming soon
                  </span>
                ) : unlocked ? (
                  <Link
                    to={`/courses/${course.slug}/lessons/${lesson.slug}`}
                    className="rounded-lg bg-stone-950 px-4 py-2 text-center font-black text-stone-50 transition active:translate-y-0.5"
                  >
                    {completed ? "Replay" : "Start"}
                  </Link>
                ) : (
                  <span className="rounded-lg border border-white/10 px-4 py-2 text-center font-black">
                    Locked
                  </span>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};
